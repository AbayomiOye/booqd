import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSlots, validDate } from '@/lib/availability.cjs'

export async function GET(req) {
  const params = new URL(req.url).searchParams
  const serviceId = Number(params.get('serviceId'))
  const date = params.get('date')
  if (!Number.isSafeInteger(serviceId) || serviceId < 1 || !validDate(date)) return NextResponse.json({ error: 'Choose a valid service and date' }, { status: 400 })
  try {
    const service = await prisma.service.findUnique({ where: { id: serviceId }, include: { provider: { select: { openingHours: true } } } })
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    const start = new Date(`${date}T00:00:00+01:00`)
    const busy = await prisma.appointment.findMany({ where: {
      providerId: service.providerId, status: { in: ['PENDING', 'CONFIRMED'] },
      apptDate: { lt: new Date(start.getTime() + 86400000) }, endsAt: { gt: start },
    }, select: { apptDate: true, endsAt: true } })
    return NextResponse.json({ slots: getSlots({ date, durationMin: service.durationMin, openingHours: service.provider.openingHours, busy }) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('Availability lookup failed', err)
    return NextResponse.json({ error: 'Availability could not be loaded. Please try again.' }, { status: 500 })
  }
}
