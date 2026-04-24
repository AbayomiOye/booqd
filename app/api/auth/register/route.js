// app/api/auth/register/route.js
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req) {
  try {
    const { name, email, password, role, businessName, location, phone, category } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const userRole = role === 'PROVIDER' ? 'PROVIDER' : 'CLIENT'

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: userRole,
        ...(userRole === 'PROVIDER' ? {
          provider: {
            create: {
              businessName: businessName || name,
              location: location || '',
              phone: phone || '',
              category: category || 'General',
            }
          }
        } : {})
      },
      include: { provider: true }
    })

    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role })
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({ success: true, role: user.role })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
