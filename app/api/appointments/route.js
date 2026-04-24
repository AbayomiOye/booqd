// app/api/appointments/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'You must be signed in to book' }, { status: 401 })
    }

    const { serviceId, providerId, date, time } = await req.json()
    if (!serviceId || !providerId || !date || !time) {
      return NextResponse.json({ error: 'All booking fields are required' }, { status: 400 })
    }

    // Validate service belongs to provider
    const service = await prisma.service.findFirst({
      where: { id: serviceId, providerId },
    })
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Build appointment datetime
    const apptDate = new Date(`${date}T${time}:00`)
    if (isNaN(apptDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date or time' }, { status: 400 })
    }
    if (apptDate < new Date()) {
      return NextResponse.json({ error: 'Appointment must be in the future' }, { status: 400 })
    }

    // Conflict detection: check if provider has an overlapping PENDING/CONFIRMED appointment
    const apptEnd = new Date(apptDate.getTime() + service.durationMin * 60 * 1000)

    const conflicts = await prisma.appointment.findMany({
      where: {
        providerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        apptDate: {
          gte: new Date(apptDate.getTime() - 4 * 60 * 60 * 1000), // window: 4hrs before
          lte: apptEnd,
        },
      },
      include: { service: true },
    })

    for (const existing of conflicts) {
      const existEnd = new Date(existing.apptDate.getTime() + existing.service.durationMin * 60 * 1000)
      if (apptDate < existEnd && apptEnd > existing.apptDate) {
        return NextResponse.json({
          error: 'This time slot is already booked. Please choose a different time.',
        }, { status: 409 })
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId: session.id,
        serviceId,
        providerId,
        apptDate,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true, appointmentId: appointment.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Booking failed. Please try again.' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const where = session.role === 'CLIENT'
      ? { clientId: session.id }
      : session.role === 'PROVIDER'
        ? { provider: { userId: session.id } }
        : {}

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        service: true,
        client: { select: { name: true, email: true } },
        provider: { select: { businessName: true, location: true } },
      },
      orderBy: { apptDate: 'asc' },
    })

    return NextResponse.json(appointments)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }
}
