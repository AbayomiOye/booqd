// app/api/appointments/[id]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordActivity } from '@/lib/activity'
import { getSession } from '@/lib/auth'
import { canTransition } from '@/lib/booking-rules.cjs'

export async function PATCH(req, { params }) {
  params = await params
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = Number(params.id)
    if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 })
    const { status } = await req.json()
    const validStatuses = ['CONFIRMED', 'CANCELLED', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const appt = await prisma.appointment.findUnique({
      where: { id: id },
      include: { provider: true },
    })
    if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

    // Only the provider or admin can confirm/complete; client can cancel their own
    const isProvider = session.role === 'PROVIDER' && appt.provider.userId === session.id
    const isClient = session.role === 'CLIENT' && appt.clientId === session.id && status === 'CANCELLED'
    const isAdmin = session.role === 'ADMIN'

    if (!isProvider && !isClient && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!canTransition(appt.status, status)) {
      return NextResponse.json({ error: 'This booking status cannot be changed that way' }, { status: 409 })
    }
    const updated = await prisma.$transaction(async tx => {
      const result = await tx.appointment.updateMany({ where: { id, status: appt.status }, data: { status } })
      if (!result.count) return null
      await recordActivity(tx, session.id, 'BOOKING_UPDATED', `${session.name} changed booking #${id} to ${status.toLowerCase()}`, { bookingId: id, from: appt.status, to: status })
      return tx.appointment.findUnique({ where: { id } })
    })
    if (!updated) return NextResponse.json({ error: 'Booking changed. Refresh and try again.' }, { status: 409 })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
