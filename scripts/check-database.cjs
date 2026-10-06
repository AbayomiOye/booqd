const { PrismaClient } = require('@prisma/client')
const { randomUUID } = require('node:crypto')
const assert = require('node:assert/strict')
const prisma = new PrismaClient()
const rollback = new Error('ROLLBACK_VERIFICATION')
async function main() {
  await prisma.$queryRaw`SELECT 1`
  try {
    await prisma.$transaction(async tx => {
      const marker = randomUUID()
      const client = await tx.user.create({ data: { name: 'Database verification', email: `${marker}@example.invalid`, passwordHash: 'not-a-login-hash' } })
      const providerUser = await tx.user.create({ data: { name: 'Verification provider', email: `provider-${marker}@example.invalid`, passwordHash: 'not-a-login-hash', role: 'PROVIDER' } })
      const provider = await tx.provider.create({ data: { userId: providerUser.id, businessName: 'Verification', location: 'Test', phone: '' } })
      const service = await tx.service.create({ data: { providerId: provider.id, serviceName: 'Verification service', durationMin: 60, price: 1000 } })
      const apptDate = new Date(Date.now() + 86400000)
      const booking = await tx.appointment.create({ data: { clientId: client.id, providerId: provider.id, serviceId: service.id, apptDate, endsAt: new Date(apptDate.getTime() + 3600000), serviceName: service.serviceName, price: service.price, durationMin: service.durationMin } })
      const saved = await tx.appointment.findUnique({ where: { id: booking.id } })
      assert.equal(saved.clientId, client.id)
      assert.equal(saved.price, 1000)
      await tx.appointment.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } })
      assert.equal((await tx.appointment.findUnique({ where: { id: booking.id } })).status, 'CANCELLED')
      const activity = await tx.activity.create({ data: { actorId: client.id, action: 'VERIFICATION', summary: 'Admin activity storage verification' } })
      assert.equal((await tx.activity.findUnique({ where: { id: activity.id } })).actorId, client.id)
      const tables = await tx.$queryRaw`SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname IN ('User', 'Provider', 'Service', 'Appointment', 'Portfolio', 'Activity')`
      assert.equal(tables.length, 6)
      assert.ok(tables.every(t => t.relrowsecurity), 'Every app table must have RLS enabled')
      const grants = await tx.$queryRaw`SELECT table_name FROM information_schema.role_table_grants WHERE table_schema = 'public' AND table_name IN ('User', 'Provider', 'Service', 'Appointment', 'Portfolio', 'Activity') AND grantee IN ('anon', 'authenticated')`
      assert.equal(grants.length, 0, 'Browser roles must not have direct access')
      throw rollback
    })
  } catch (err) { if (err !== rollback) throw err }
  console.log('Database verified: create, retrieve, cancel, RLS and grants. Verification rows rolled back.')
}
main().catch(err => { console.error(err.message); process.exitCode = 1 }).finally(() => prisma.$disconnect())
