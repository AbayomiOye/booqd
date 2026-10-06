const { test, expect } = require('@playwright/test')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { randomUUID } = require('node:crypto')
const prisma = new PrismaClient()
const marker = randomUUID()
const password = randomUUID() + 'aA1!'
let client, outsider, providerUser, provider, service
const future = day => new Date(Date.now() + day * 86400000).toISOString().slice(0, 10)
// Run authenticated API checks inside Chrome so its secure localhost cookies
// follow the same rules as the application's own fetch requests.
function browserApi(page) {
  const send = async (method, url, options = {}) => {
    const result = await page.evaluate(async ({ method, url, data }) => {
      const response = await fetch(url, {
        method, credentials: 'same-origin',
        headers: data ? { 'Content-Type': 'application/json' } : undefined,
        body: data ? JSON.stringify(data) : undefined,
      })
      return { status: response.status, body: await response.json() }
    }, { method, url, data: options.data })
    return { status: () => result.status, json: async () => result.body }
  }
  return { get: (url, options) => send('GET', url, options), post: (url, options) => send('POST', url, options), patch: (url, options) => send('PATCH', url, options) }
}
async function login(page, user) {
  await page.goto('/login')
  await page.getByPlaceholder('you@email.com').fill(user.email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(user.role === 'PROVIDER' ? /\/provider$/ : /\/search$/)
}

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash(password, 12)
  client = await prisma.user.create({ data: { name: 'E2E Booking Client', email: `e2e-client-${marker}@example.invalid`, passwordHash } })
  outsider = await prisma.user.create({ data: { name: 'E2E Other Client', email: `e2e-other-${marker}@example.invalid`, passwordHash } })
  providerUser = await prisma.user.create({ data: { name: 'E2E Provider', email: `e2e-provider-${marker}@example.invalid`, passwordHash, role: 'PROVIDER' } })
  provider = await prisma.provider.create({ data: { userId: providerUser.id, businessName: `E2E Salon ${marker}`, phone: '', location: 'Lagos', verified: true } })
  service = await prisma.service.create({ data: { providerId: provider.id, serviceName: 'E2E Hair Appointment', durationMin: 60, price: 5000 } })
})
test.afterAll(async () => {
  // Delete only this run's disposable fixtures, never existing users/bookings.
  if (provider) {
    await prisma.appointment.deleteMany({ where: { providerId: provider.id } })
    await prisma.service.deleteMany({ where: { providerId: provider.id } })
    await prisma.provider.delete({ where: { id: provider.id } })
  }
  await prisma.user.deleteMany({ where: { email: { in: [`e2e-client-${marker}@example.invalid`, `e2e-other-${marker}@example.invalid`, `e2e-provider-${marker}@example.invalid`, `e2e-register-${marker}@example.invalid`] } } })
  await prisma.$disconnect()
})

test('customer books, reloads saved history, and cancels through the UI', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', err => pageErrors.push(err.message))
  await login(page, client)
  await page.goto(`/providers/${provider.id}`)
  await page.locator('input[type="date"]').fill(future(3))
  await page.locator('select').last().selectOption('09:00')
  await page.getByRole('button', { name: 'Review booking' }).click()
  await expect(page.getByRole('heading', { name: 'Review your booking' })).toBeVisible()
  await expect(page.getByText('Service total', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Confirm booking' }).click()
  await expect(page.getByRole('heading', { name: 'Booking requested!' })).toBeVisible()
  await page.getByRole('link', { name: 'View my bookings' }).click()
  await expect(page.getByRole('article')).toContainText('E2E Hair Appointment')
  await page.reload()
  await expect(page.getByRole('article')).toContainText('Awaiting confirmation')
  await page.screenshot({ path: '/private/tmp/booqd-bookings-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: 'Cancel booking' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: '/private/tmp/booqd-bookings-mobile.png', fullPage: true })
  expect(pageErrors).toEqual([])
  await page.getByRole('button', { name: 'Cancel booking' }).click()
  await page.getByRole('button', { name: 'Yes, cancel' }).click()
  await expect(page.getByRole('article')).toContainText('Cancelled')
  await page.reload()
  await page.getByRole('button', { name: /^Past/ }).click()
  await expect(page.getByRole('article')).toContainText('Cancelled')
})

test('provider confirms and completes a saved booking through the dashboard', async ({ page, browser }) => {
  await login(page, client)
  const response = await browserApi(page).post('/api/appointments', { data: { serviceId: service.id, providerId: provider.id, date: future(4), time: '10:00' } })
  expect(response.status()).toBe(201)
  const context = await browser.newContext()
  const providerPage = await context.newPage()
  await login(providerPage, providerUser)
  await providerPage.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(providerPage.getByText('CONFIRMED', { exact: true })).toBeVisible()
  await providerPage.getByRole('button', { name: 'Mark done' }).click()
  await expect(providerPage.getByText('COMPLETED', { exact: true })).toBeVisible()
  await page.goto('/bookings')
  await page.getByRole('button', { name: /^Past/ }).click()
  await expect(page.getByRole('article').filter({ hasText: 'Completed' })).toBeVisible()
  await context.close()
})

test('signed-out and other customers cannot read or change someone else’s bookings', async ({ page, browser, request }) => {
  expect((await request.get('/api/appointments')).status()).toBe(401)
  await login(page, client)
  const result = await browserApi(page).post('/api/appointments', { data: { serviceId: service.id, providerId: provider.id, date: future(5), time: '11:00' } })
  const { appointmentId } = await result.json()
  expect(result.status()).toBe(201)
  const context = await browser.newContext()
  const other = await context.newPage()
  await login(other, outsider)
  expect(await (await browserApi(other).get('/api/appointments')).json()).toEqual([])
  expect((await browserApi(other).patch(`/api/appointments/${appointmentId}`, { data: { status: 'CANCELLED' } })).status()).toBe(403)
  expect((await browserApi(page).patch(`/api/appointments/${appointmentId}`, { data: { status: 'CONFIRMED' } })).status()).toBe(403)
  await context.close()
})

test('simultaneous overlapping bookings produce one success and one conflict', async ({ page }) => {
  await login(page, client)
  const data = { serviceId: service.id, providerId: provider.id, date: future(6), time: '12:00' }
  const responses = await Promise.all([browserApi(page).post('/api/appointments', { data }), browserApi(page).post('/api/appointments', { data })])
  expect(responses.map(r => r.status()).sort()).toEqual([201, 409])
})

test('forged cookies cannot authorize protected pages or APIs', async ({ browser }) => {
  const context = await browser.newContext()
  const forged = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ id: providerUser.id, role: 'ADMIN' })).toString('base64url'), 'fake'].join('.')
  await context.addCookies([{ name: 'auth_token', value: forged, url: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100' }])
  const page = await context.newPage()
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login$/)
  expect((await browserApi(page).get('/api/appointments')).status()).toBe(401)
  await context.close()
})


test('customer registration and sign-out work through the UI', async ({ page }) => {
  await page.goto('/register')
  await page.getByPlaceholder('Amara Obi').fill('E2E Registered Client')
  await page.getByPlaceholder('amara@email.com').fill(`e2e-register-${marker}@example.invalid`)
  await page.getByPlaceholder('At least 8 characters').fill(password)
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/search$/)
  await page.getByRole('link', { name: 'My bookings' }).click()
  await expect(page.getByText('You have no bookings yet.')).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(`${process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100'}/`)
  expect((await browserApi(page).get('/api/appointments')).status()).toBe(401)
})


test('availability hides overlaps and respects service duration at closing time', async ({ page }) => {
  await login(page, client)
  const date = future(10)
  expect((await browserApi(page).post('/api/appointments', { data: { serviceId: service.id, providerId: provider.id, date, time: '09:00' } })).status()).toBe(201)
  const response = await browserApi(page).get(`/api/availability?serviceId=${service.id}&date=${date}`)
  const data = await response.json()
  expect(Object.keys(data)).toEqual(['slots'])
  expect(data.slots.find(s => s.time === '09:00').available).toBe(false)
  expect(data.slots.find(s => s.time === '09:30').available).toBe(false)
  expect(data.slots.find(s => s.time === '10:00').available).toBe(true)
  expect(data.slots.some(s => s.time === '17:30')).toBe(false)
  await page.goto(`/providers/${provider.id}`)
  await page.getByLabel('Date', { exact: true }).fill(date)
  await expect(page.locator('#booking-time option[value="09:00"]')).toBeDisabled()
  await expect(page.locator('#booking-time option[value="10:00"]')).toBeEnabled()
  await page.setViewportSize({ width: 375, height: 812 })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({ path: '/private/tmp/booqd-profile-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('provider hours save through the UI and closed days cannot be booked', async ({ page }) => {
  await login(page, providerUser)
  await page.getByRole('button', { name: 'Working hours', exact: true }).click()
  const date = future(11)
  const day = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
  await page.getByRole('group', { name: day, exact: true }).getByLabel('Closed').check()
  await page.getByRole('button', { name: 'Save working hours' }).click()
  await expect(page.getByText('Working hours saved.')).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Working hours', exact: true }).click()
  await expect(page.getByRole('group', { name: day, exact: true }).getByLabel('Closed')).toBeChecked()
  expect((await (await browserApi(page).get(`/api/availability?serviceId=${service.id}&date=${date}`)).json()).slots).toEqual([])
  await login(page, client)
  expect((await browserApi(page).post('/api/appointments', { data: { serviceId: service.id, providerId: provider.id, date, time: '09:00' } })).status()).toBe(400)
})

test('search filters are accessible, preserved, and usable on a small phone', async ({ page }) => {
  await page.goto('/search')
  await page.getByLabel('Service or business').fill(marker)
  await page.getByLabel('City or area').fill('Lagos')
  await page.getByLabel('Budget', { exact: true }).selectOption('5000')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.getByRole('heading', { name: provider.businessName, exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Nails', exact: true }).click()
  expect(new URL(page.url()).searchParams.get('budget')).toBe('5000')
  expect(new URL(page.url()).searchParams.get('q')).toBe(marker)
  await expect(page.getByRole('heading', { name: 'No matches just yet' })).toBeVisible()
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: '/private/tmp/booqd-search-mobile.png', fullPage: true })
  await page.setViewportSize({ width: 812, height: 375 })
  await page.evaluate(() => { document.documentElement.style.fontSize = '24px' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('provider calendar can filter bookings and fits a small phone', async ({ page }) => {
  await login(page, providerUser)
  await page.getByRole('button', { name: 'Calendar', exact: true }).click()
  const date = future(4)
  await page.getByRole('button', { name: new RegExp(`^${date},`) }).click()
  await expect(page.getByText(`Appointments on ${date}`)).toBeVisible()
  await expect(page.getByText('COMPLETED', { exact: true })).toBeVisible()
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: '/private/tmp/booqd-calendar-mobile.png', fullPage: true })
})

test('homepage is usable on mobile and makes no unsupported platform size claims', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Connect. Book. Glow.' })).toBeVisible()
  await expect(page.getByText('500+', { exact: true })).toHaveCount(0)
  await expect(page.getByText('10,000+', { exact: true })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: '/private/tmp/booqd-home-mobile.png', fullPage: true })
})
