'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function RegisterForm() {
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
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="font-bold text-xl tracking-tight">
              <span className="text-gray-900">Boo</span><span className="text-brand-600">qd</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Find your next appointment or grow your beauty business</p>
        </div>
        <div className="card p-1 flex mb-6 gap-1">
          {[['CLIENT', 'I want to book'], ['PROVIDER', 'I offer services']].map(([r, label]) => (
            <button key={r} aria-pressed={role === r} onClick={() => setRole(r)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${role === r ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="card p-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label htmlFor="field-1" className="label">Full name</label><input id="field-1" className="input" placeholder="Amara Obi" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div><label htmlFor="field-2" className="label">Email address</label><input id="field-2" className="input" type="email" placeholder="amara@email.com" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
            <div><label htmlFor="field-3" className="label">Password</label><input id="field-3" className="input" type="password" placeholder="At least 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} /></div>
            {role === 'PROVIDER' && (
              <>
                <hr className="border-gray-100" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business Details</p>
                <div><label htmlFor="field-4" className="label">Business name</label><input id="field-4" className="input" placeholder="Zara's Glam Studio" value={form.businessName} onChange={e => set('businessName', e.target.value)} required /></div>
                <div><label htmlFor="field-5" className="label">Category</label>
                  <select id="field-5" className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                    {['Makeup & Hair','Nails','Skincare','Lashes','Braiding','Spa','General'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label htmlFor="field-6" className="label">Location</label><input id="field-6" className="input" placeholder="Lekki Phase 1, Lagos" value={form.location} onChange={e => set('location', e.target.value)} required /></div>
                <div><label htmlFor="field-7" className="label">Phone number</label><input id="field-7" className="input" placeholder="08012345678" value={form.phone} onChange={e => set('phone', e.target.value)} required /></div>
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
