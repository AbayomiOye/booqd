// middleware.js - Edge runtime compatible
import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value

  let session = null
  if (token) {
    try {
      // Decode JWT payload without verification (verification happens in API routes)
      const payload = JSON.parse(atob(token.split('.')[1]))
      session = payload
    } catch {}
  }

  if (pathname.startsWith('/provider')) {
    if (!session || session.role !== 'PROVIDER') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/provider/:path*', '/admin/:path*'],
}
