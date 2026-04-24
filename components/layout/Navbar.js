// components/layout/Navbar.js
import Link from 'next/link'
import { getSession } from '@/lib/auth'

export default async function Navbar() {
  const session = await getSession()

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-gray-900">Boo</span><span className="text-brand-600">qd</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/search" className="btn-ghost">Find Services</Link>
          {session?.role === 'PROVIDER' && (
            <Link href="/provider" className="btn-ghost">Dashboard</Link>
          )}
          {session?.role === 'ADMIN' && (
            <Link href="/admin" className="btn-ghost">Admin</Link>
          )}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="hidden md:block text-sm text-gray-600">
                Hi, {session.name?.split(' ')[0]}
              </span>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="btn-ghost text-sm">Sign out</button>
              </form>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Sign in</Link>
              <Link href="/register" className="btn-primary">Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
