// app/api/services/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { providerId, serviceName, description, durationMin, price } = await req.json()

    // Verify provider belongs to this user
    const provider = await prisma.provider.findFirst({ where: { id: providerId, userId: session.id } })
    if (!provider) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const service = await prisma.service.create({
      data: { providerId, serviceName, description, durationMin, price },
    })
    return NextResponse.json(service)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
