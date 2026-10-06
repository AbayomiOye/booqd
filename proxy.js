// Route prefilter; pages and APIs enforce authorization.
import { NextResponse } from 'next/server'

export function proxy(request) {
  const token = request.cookies.get('auth_token')?.value

  // Authorization is checked against verified sessions and current DB roles in pages/APIs.
  if (!token) return NextResponse.redirect(new URL('/login', request.url))

  return NextResponse.next()
}

export const config = {
  matcher: ['/provider/:path*', '/admin/:path*'],
}
