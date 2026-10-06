// app/api/services/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordActivity } from '@/lib/activity'
import { getSession } from '@/lib/auth'

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { providerId, serviceName, description, durationMin, price } = await req.json()

    if (!Number.isSafeInteger(providerId) || typeof serviceName !== 'string' || !serviceName.trim() ||
        !Number.isInteger(durationMin) || durationMin < 1 || durationMin > 1440 ||
        typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Enter a service name, a valid duration and a non-negative price' }, { status: 400 })
    }
    // Verify provider belongs to this user
    const provider = await prisma.provider.findFirst({ where: { id: providerId, userId: session.id } })
    if (!provider) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const service = await prisma.$transaction(async tx => {
      const saved = await tx.service.create({
      data: { providerId, serviceName, description, durationMin, price },
      })
      await recordActivity(tx, session.id, 'SERVICE_CREATED', `${session.name} added ${serviceName}`, { serviceId: saved.id, providerId })
      return saved
    })
    return NextResponse.json(service)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
