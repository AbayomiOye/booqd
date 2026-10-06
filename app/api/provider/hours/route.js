import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordActivity } from '@/lib/activity'
import { getSession } from '@/lib/auth'
import { validateHours } from '@/lib/availability.cjs'
export async function PATCH(req) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PROVIDER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { openingHours } = await req.json()
    if (!validateHours(openingHours)) return NextResponse.json({ error: 'Set seven days with closing times after opening times, in 30-minute increments' }, { status: 400 })
    const result = await prisma.$transaction(async tx => {
      const provider = await tx.provider.findUnique({ where: { userId: session.id } })
      if (!provider) return null
      await tx.$queryRaw`SELECT id FROM "Provider" WHERE id = ${provider.id} FOR UPDATE`
      const saved = await tx.provider.update({ where: { id: provider.id }, data: { openingHours } })
      await recordActivity(tx, session.id, 'HOURS_UPDATED', `${session.name} updated working hours`, { providerId: provider.id })
      return saved
    })
    if (!result) return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    return NextResponse.json({ openingHours: result.openingHours })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Could not save working hours' }, { status: 500 })
  }
}
