'use client'
import { useState } from 'react'
import { DEFAULT_HOURS, validateHours } from '@/lib/availability.cjs'
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export default function WorkingHours({ initialHours }) {
  const [hours, setHours] = useState(validateHours(initialHours) ? initialHours : DEFAULT_HOURS)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  function change(i, key, value) { setSaved(false); setHours(list => list.map((h, idx) => idx === i ? { ...h, [key]: value } : h)) }
  async function save(e) {
    e.preventDefault(); setBusy(true); setError(''); setSaved(false)
    try {
      const res = await fetch('/api/provider/hours', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ openingHours: hours }) })
      const data = await res.json(); if (!res.ok) throw new Error(data.error)
      setHours(data.openingHours); setSaved(true)
    } catch (err) { setError(err.message || 'Could not save hours') } finally { setBusy(false) }
  }
  return <section className="card p-5 sm:p-6"><h2 className="text-xl font-bold">Your working hours</h2><p className="mt-2 max-w-xl text-sm text-gray-600">Set when customers can book, in Nigeria time (WAT). Changes affect new requests; existing bookings stay as agreed.</p><form onSubmit={save} className="mt-6 space-y-5">{DAYS.map((day, i) => <fieldset key={day} className="rounded-xl border border-gray-200 p-4" disabled={busy}><legend className="px-1 font-semibold">{day}</legend><div className="flex flex-wrap items-end gap-4"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={hours[i].closed} onChange={e => change(i, 'closed', e.target.checked)} className="h-5 w-5 accent-purple-700" />Closed</label><div className="min-w-0 flex-1"><label htmlFor={`hours-open-${i}`} className="label">Opens</label><input id={`hours-open-${i}`} type="time" step="1800" className="input" value={hours[i].open} onChange={e => change(i, 'open', e.target.value)} disabled={hours[i].closed} required /></div><div className="min-w-0 flex-1"><label htmlFor={`hours-close-${i}`} className="label">Closes</label><input id={`hours-close-${i}`} type="time" step="1800" className="input" value={hours[i].close} onChange={e => change(i, 'close', e.target.value)} disabled={hours[i].closed} required /></div></div></fieldset>)}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}{saved && <p role="status" className="text-sm text-green-700">Working hours saved.</p>}<button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save working hours'}</button></form></section>
}
