import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { parseBooking } from '@/lib/booking-rules.cjs'

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'You must be signed in to book' }, { status: 401 })
    let booking
    try { booking = parseBooking(await req.json()) }
    catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }) }
    const { serviceId, providerId, apptDate } = booking
    const appointment = await prisma.$transaction(async tx => {
      // All bookings for this provider share a transaction-scoped lock.
      await tx.$queryRaw`SELECT id FROM "Provider" WHERE id = ${providerId} FOR UPDATE`
      const service = await tx.service.findFirst({ where: { id: serviceId, providerId } })
      if (!service) throw Object.assign(new Error('Service not found'), { status: 404 })
      const endsAt = new Date(apptDate.getTime() + service.durationMin * 60000)
      const conflict = await tx.appointment.findFirst({ where: {
        providerId, status: { in: ['PENDING', 'CONFIRMED'] },
        apptDate: { lt: endsAt }, endsAt: { gt: apptDate },
      } })
      if (conflict) throw Object.assign(new Error('This time slot is already booked. Please choose another time.'), { status: 409 })
      return tx.appointment.create({ data: {
        clientId: session.id, serviceId, providerId, apptDate, endsAt,
        serviceName: service.serviceName, price: service.price, durationMin: service.durationMin,
      } })
    })
    return NextResponse.json({ success: true, appointmentId: appointment.id, appointment }, { status: 201 })
  } catch (err) {
    console.error('Booking failed', err)
    return NextResponse.json({ error: err.status ? err.message : 'Booking failed. Please try again.' }, { status: err.status || 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const where = session.role === 'CLIENT' ? { clientId: session.id }
      : session.role === 'PROVIDER' ? { provider: { userId: session.id } }
      : session.role === 'ADMIN' ? {} : null
    if (!where) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: { select: { name: true, email: true } },
        provider: { select: { businessName: true, location: true } },
      },
      orderBy: { apptDate: 'desc' },
    })
    return NextResponse.json(appointments, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }
}
