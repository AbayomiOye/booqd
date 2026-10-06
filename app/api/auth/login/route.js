// app/api/auth/login/route.js
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { recordActivity } from '@/lib/activity'
import { signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req) {
  try {
    const { email: rawEmail, password } = await req.json()
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
    if (!email || typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role })
    await recordActivity(prisma, user.id, 'SIGNED_IN', `${user.name} signed in`)
    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({ success: true, role: user.role })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 })
  }
}
