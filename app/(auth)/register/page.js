// app/(auth)/register/page.js
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const params = useSearchParams()
  const defaultRole = params.get('role') === 'provider' ? 'PROVIDER' : 'CLIENT'

  const [role, setRole] = useState(defaultRole)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '', location: '', phone: '', category: 'Makeup & Hair' })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return }
    router.push(role === 'PROVIDER' ? '/provider' : '/search')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Booqd</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join thousands of beauty professionals and clients</p>
        </div>

        {/* Role switcher */}
        <div className="card p-1 flex mb-6 gap-1">
          {[['CLIENT', '🛍️ I want to book'], ['PROVIDER', '💼 I offer services']].map(([r, label]) => (
            <button key={r} onClick={() => setRole(r)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${role === r ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="card p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" placeholder="Amara Obi" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="amara@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="At least 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
            </div>

            {role === 'PROVIDER' && (
              <>
                <hr className="border-gray-100" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business Details</p>
                <div>
                  <label className="label">Business name</label>
                  <input className="input" placeholder="Zara's Glam Studio" value={form.businessName} onChange={e => set('businessName', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                    {['Makeup & Hair','Nails','Skincare','Lashes','Braiding','Spa','General'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Location</label>
                  <input className="input" placeholder="Lekki Phase 1, Lagos" value={form.location} onChange={e => set('location', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Phone number</label>
                  <input className="input" placeholder="08012345678" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                </div>
              </>
            )}

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
