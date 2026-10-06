// lib/auth.js
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters')
  return secret
}

export function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret(), { algorithms: ['HS256'] })
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  const claims = verifyToken(token)
  if (!claims || !Number.isSafeInteger(claims.id)) return null
  const { prisma } = await import('@/lib/prisma')
  return prisma.user.findUnique({
    where: { id: claims.id },
    select: { id: true, name: true, email: true, role: true },
  })
}

export async function requireSession() {
  const session = await getSession()
  if (!session) return null
  return session
}
