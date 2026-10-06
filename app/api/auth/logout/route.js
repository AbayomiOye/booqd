// app/api/auth/logout/route.js
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  (await cookies()).delete('auth_token')
  return new NextResponse(null, { status: 303, headers: { Location: '/' } })
}
