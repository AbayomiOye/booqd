'use client'
import { useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/Icon'
const statuses = { PENDING: ['Awaiting confirmation', 'badge-yellow'], CONFIRMED: ['Confirmed', 'badge-green'], CANCELLED: ['Cancelled', 'badge-gray'], COMPLETED: ['Completed', 'badge-purple'] }
export default function BookingList({ initialBookings }) {
  const [bookings, setBookings] = useState(initialBookings)
  const [tab, setTab] = useState('upcoming')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const isUpcoming = b => ['PENDING', 'CONFIRMED'].includes(b.status) && new Date(b.apptDate) >= new Date()
  const groups = { upcoming: bookings.filter(isUpcoming).sort((a, b) => new Date(a.apptDate) - new Date(b.apptDate)), past: bookings.filter(b => !isUpcoming(b)) }
  async function cancel(id) {
    setBusy(id); setError('')
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CANCELLED' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cancellation failed')
      setBookings(list => list.map(b => b.id === id ? { ...b, status: data.status } : b)); setConfirmId(null); setTab('past')
    } catch (err) { setError(err.message) } finally { setBusy(null) }
  }
  return <div className="space-y-5">
    <div className="flex gap-2 border-b border-gray-200" aria-label="Booking history">{['upcoming', 'past'].map(key => <button key={key} aria-pressed={tab === key} className={`min-h-12 border-b-2 px-4 font-medium ${tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-600'}`} onClick={() => setTab(key)}>{key === 'upcoming' ? 'Upcoming' : 'Past'} <span className="ml-1 text-sm">({groups[key].length})</span></button>)}</div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {!groups[tab].length && <div className="card p-8 text-center"><Icon name="calendar" className="mx-auto h-10 w-10 text-brand-400" /><h2 className="mt-4 text-lg font-semibold">{!bookings.length ? 'You have no bookings yet.' : tab === 'upcoming' ? 'Nothing upcoming yet' : 'No past bookings yet'}</h2><p className="mt-2 text-sm text-gray-600">{tab === 'upcoming' ? 'Find a service and make some time for yourself.' : 'Completed and cancelled appointments will appear here.'}</p>{tab === 'upcoming' && <Link href="/search" className="btn-primary mt-5">Find a service</Link>}</div>}
    {groups[tab].map(b => <article key={b.id} className="card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="text-lg font-semibold">{b.serviceName}</h2><span className={statuses[b.status][1]}>{statuses[b.status][0]}</span></div><p className="mt-2 text-sm text-gray-600">{b.provider.businessName} · {b.provider.location}</p><div className="my-5 flex items-center gap-3"><div className="rounded-xl bg-brand-50 p-3 text-brand-700"><Icon name="calendar" /></div><div><p className="font-medium">{new Date(b.apptDate).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</p><p className="text-sm text-gray-600">{new Date(b.apptDate).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' })} WAT · {b.durationMin} minutes</p></div></div><div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4"><div><p className="font-semibold">₦{b.price.toLocaleString()}</p><p className="text-xs text-gray-600">Booking #{b.id}</p></div><Link href={`/providers/${b.providerId}`} className="btn-outline">Provider details<Icon name="arrow" className="h-4 w-4" /></Link></div>
      {b.status === 'PENDING' && <p className="mt-4 text-sm text-gray-600">Your provider will review this request. Check here for confirmation.</p>}
      {['PENDING', 'CONFIRMED'].includes(b.status) && (confirmId === b.id ? <div className="mt-4 rounded-xl bg-red-50 p-4"><p className="mb-3 text-sm text-red-800">Cancel this appointment? Contact your provider about any payment arrangements.</p><div className="flex flex-wrap gap-2"><button className="btn-outline" disabled={busy !== null} onClick={() => setConfirmId(null)}>Keep booking</button><button className="btn-primary bg-red-700 hover:bg-red-800" disabled={busy !== null} onClick={() => cancel(b.id)}>{busy === b.id ? 'Cancelling…' : 'Yes, cancel'}</button></div></div> : <button className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-red-700" disabled={busy !== null} onClick={() => setConfirmId(b.id)}>Cancel booking</button>)}
    </article>)}
  </div>
}
