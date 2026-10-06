import { prisma } from '@/lib/prisma'
export const ADMIN_TABS = ['overview', 'activity', 'bookings', 'providers', 'users']
export const ACTIVITY_ACTIONS = ['ACCOUNT_CREATED', 'SIGNED_IN', 'BOOKING_CREATED', 'BOOKING_UPDATED', 'SERVICE_CREATED', 'SERVICE_REMOVED', 'HOURS_UPDATED', 'ADMIN_GRANTED']
const PAGE_SIZE = 20
export async function getAdminDashboard(params = {}) {
  const tab = ADMIN_TABS.includes(params.tab) ? params.tab : 'overview'
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 120) : ''
  const range = ['7', '30', '90', 'all'].includes(params.range) ? params.range : '30'
  const page = Math.max(1, Math.min(Number.parseInt(params.page, 10) || 1, 100000))
  const createdAt = range === 'all' ? undefined : { gte: new Date(Date.now() - Number(range) * 86400000) }
  const skip = (page - 1) * PAGE_SIZE
  const [userCount, providerCount, unverifiedCount, bookingCount, statusCounts, completedValue] = await Promise.all([
    prisma.user.count(), prisma.provider.count(), prisma.provider.count({ where: { verified: false } }), prisma.appointment.count(),
    prisma.appointment.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.appointment.aggregate({ where: { status: 'COMPLETED' }, _sum: { price: true } }),
  ])
  const stats = { userCount, providerCount, unverifiedCount, bookingCount, completedValue: completedValue._sum.price || 0, statusCounts: Object.fromEntries(statusCounts.map(row => [row.status, row._count._all])) }
  let rows = [], total = 0, trend = []
  if (tab === 'overview' || tab === 'activity') {
    const action = ACTIVITY_ACTIONS.includes(params.action) ? params.action : undefined
    const where = { createdAt, ...(action ? { action } : {}), ...(q ? { OR: [{ summary: { contains: q, mode: 'insensitive' } }, { actor: { email: { contains: q, mode: 'insensitive' } } }] } : {}) }
    ;[rows, total] = await Promise.all([
      prisma.activity.findMany({ where, include: { actor: { select: { name: true, email: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: tab === 'overview' ? 8 : PAGE_SIZE, skip: tab === 'overview' ? 0 : skip }),
      prisma.activity.count({ where }),
    ])
  }
  if (tab === 'overview') {
    const since = new Date(Date.now() - 14 * 86400000)
    const counts = await prisma.$queryRaw`SELECT to_char("createdAt" + interval '1 hour', 'YYYY-MM-DD') AS day, count(*)::int AS count FROM "Appointment" WHERE "createdAt" >= ${since} GROUP BY 1 ORDER BY 1`
    trend = Array.from({ length: 14 }, (_, i) => {
      const day = new Date(Date.now() + 3600000 - (13 - i) * 86400000).toISOString().slice(0, 10)
      return { day, count: counts.find(row => row.day === day)?.count || 0 }
    })
  }
  if (tab === 'bookings') {
    const status = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(params.status) ? params.status : undefined
    const where = { createdAt, ...(status ? { status } : {}), ...(q ? { OR: [{ serviceName: { contains: q, mode: 'insensitive' } }, { client: { name: { contains: q, mode: 'insensitive' } } }, { provider: { businessName: { contains: q, mode: 'insensitive' } } }] } : {}) }
    ;[rows, total] = await Promise.all([
      prisma.appointment.findMany({ where, include: { client: { select: { name: true, email: true } }, provider: { select: { businessName: true, location: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: PAGE_SIZE, skip }),
      prisma.appointment.count({ where }),
    ])
  }
  if (tab === 'providers') {
    const where = { createdAt, ...(params.verified === 'yes' ? { verified: true } : params.verified === 'no' ? { verified: false } : {}), ...(q ? { OR: [{ businessName: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } }, { user: { email: { contains: q, mode: 'insensitive' } } }] } : {}) }
    ;[rows, total] = await Promise.all([
      prisma.provider.findMany({ where, include: { user: { select: { name: true, email: true } }, _count: { select: { appointments: true, services: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: PAGE_SIZE, skip }),
      prisma.provider.count({ where }),
    ])
  }
  if (tab === 'users') {
    const where = { createdAt, ...(['CLIENT', 'PROVIDER', 'ADMIN'].includes(params.role) ? { role: params.role } : {}), ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : {}) }
    ;[rows, total] = await Promise.all([
      prisma.user.findMany({ where, select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: PAGE_SIZE, skip }),
      prisma.user.count({ where }),
    ])
  }
  return { tab, range, q, page, pageSize: PAGE_SIZE, rows, total, stats, trend }
}
