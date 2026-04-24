// app/api/appointments/[id]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(req, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { status } = await req.json()
    const validStatuses = ['CONFIRMED', 'CANCELLED', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const appt = await prisma.appointment.findUnique({
      where: { id: parseInt(params.id) },
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

    const updated = await prisma.appointment.update({
      where: { id: parseInt(params.id) },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
