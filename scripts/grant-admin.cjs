// Run only after the platform owner confirms who controls this existing account.
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const email = (process.argv[2] || '').trim().toLowerCase()
async function main() {
  if (!email || !email.includes('@')) throw new Error('Supply the confirmed existing account email')
  const matches = await prisma.user.findMany({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true, name: true, role: true } })
  if (!matches.length) throw new Error('Account must be registered first; no account or password has been created')
  if (matches.length !== 1) throw new Error('Multiple accounts match; resolve duplicates before granting admin access')
  const user = matches[0]
  if (user.role === 'ADMIN') { console.log('Account already has admin access'); return }
  await prisma.$transaction(async tx => {
    await tx.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } })
    await tx.activity.create({ data: { action: 'ADMIN_GRANTED', summary: `Admin access granted to ${user.name}`, metadata: { userId: user.id } } })
  })
  console.log('Admin access granted to the confirmed existing account. Existing password preserved.')
}
main().catch(err => { console.error(err.message); process.exitCode = 1 }).finally(() => prisma.$disconnect())
