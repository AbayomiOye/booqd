// app/api/services/[id]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function DELETE(req, { params }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const service = await prisma.service.findUnique({
      where: { id: parseInt(params.id) },
      include: { provider: true },
    })
    if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (service.provider.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await prisma.service.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
