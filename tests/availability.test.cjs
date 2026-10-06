const { test } = require('node:test')
const assert = require('node:assert/strict')
const { getSlots, DEFAULT_HOURS, validateHours } = require('../lib/availability.cjs')
const options = { date: '2026-10-10', durationMin: 60, now: new Date('2026-10-06T00:00:00Z') }
test('availability checks full duration, boundaries and adjacent bookings', () => {
  const slots = getSlots({ ...options, busy: [{ apptDate: '2026-10-10T08:00:00Z', endsAt: '2026-10-10T09:00:00Z' }] })
  assert.equal(slots.find(s => s.time === '09:30').available, false)
  assert.equal(slots.find(s => s.time === '10:00').available, true)
  assert.equal(slots.at(-1).time, '17:00')
})
test('closed days have no slots and malformed schedules are rejected', () => {
  const openingHours = DEFAULT_HOURS.map(h => ({ ...h, closed: true }))
  assert.deepEqual(getSlots({ ...options, openingHours }), [])
  assert.equal(validateHours([{ open: '09:00', close: '08:00' }]), false)
  assert.deepEqual(getSlots({ ...options, date: '2026-02-30' }), [])
})
test('custom early hours work and past slots are unavailable', () => {
  const openingHours = DEFAULT_HOURS.map(h => ({ open: '07:00', close: '08:00', closed: false }))
  const slots = getSlots({ ...options, openingHours, now: new Date('2026-10-10T06:01:00Z') })
  assert.deepEqual(slots, [{ time: '07:00', available: false }])
})
