import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAdminDashboard } from '@/lib/admin-dashboard'
export async function GET(req) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const result = await getAdminDashboard(Object.fromEntries(new URL(req.url).searchParams))
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('Admin dashboard failed', err)
    return NextResponse.json({ error: 'Could not load dashboard' }, { status: 500 })
  }
}
