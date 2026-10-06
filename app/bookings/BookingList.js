'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function BookingList({ initialBookings }) {
  const [bookings, setBookings] = useState(initialBookings)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  async function cancel(id) {
    setBusy(id); setError('')
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cancellation failed')
      setBookings(list => list.map(b => b.id === id ? { ...b, status: data.status } : b))
    } catch (err) { setError(err.message) } finally { setBusy(null) }
  }
  return <div className="space-y-4">
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!bookings.length && <div className="card p-6"><p className="mb-4">You have no bookings yet.</p><Link href="/search" className="btn-primary">Find a service</Link></div>}
    {bookings.map(b => <article key={b.id} className="card p-6">
      <div className="flex justify-between gap-4"><h2 className="font-semibold">{b.serviceName}</h2><span className="badge-gray">{b.status}</span></div>
      <p className="text-gray-600">{b.provider.businessName} · {b.provider.location}</p>
      <p className="mt-2">{new Date(b.apptDate).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' })} WAT</p>
      <p className="text-sm text-gray-500">{b.durationMin} minutes · ₦{b.price.toLocaleString()} · Booking #{b.id}</p>
      {['PENDING', 'CONFIRMED'].includes(b.status) && <button className="btn-outline mt-4" disabled={busy !== null} onClick={() => cancel(b.id)}>{busy === b.id ? 'Cancelling…' : 'Cancel booking'}</button>}
    </article>)}
  </div>
}
