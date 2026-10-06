'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/Icon'

export default function BookingForm({ services, providerId, businessName, location }) {
  const [serviceId, setServiceId] = useState(services[0]?.id || '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [slots, setSlots] = useState([])
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState(null)
  const [review, setReview] = useState(false)
  const [error, setError] = useState('')
  const [availabilityError, setAvailabilityError] = useState('')
  const [retry, setRetry] = useState(0)
  const reviewHeading = useRef(null)
  const selectedService = services.find(s => s.id === Number(serviceId))
  const today = new Date(Date.now() + 3600000).toISOString().slice(0, 10)
  useEffect(() => {
    setTime(''); setSlots([]); setAvailabilityError(''); setReview(false)
    if (!date || !serviceId) return
    const controller = new AbortController()
    setChecking(true)
    fetch(`/api/availability?${new URLSearchParams({ serviceId, date })}`, { signal: controller.signal })
      .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.error); return data })
      .then(data => setSlots(data.slots))
      .catch(err => { if (err.name !== 'AbortError') setAvailabilityError(err.message || 'Could not load times') })
      .finally(() => { if (!controller.signal.aborted) setChecking(false) })
    return () => controller.abort()
  }, [date, serviceId, retry])
  useEffect(() => { if (review) reviewHeading.current?.focus() }, [review])
  async function submit(e) {
    e.preventDefault(); setError('')
    if (!review) { setReview(true); return }
    setLoading(true)
    try {
      const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceId: Number(serviceId), providerId, date, time }) })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) { setReview(false); setRetry(n => n + 1) }
        throw new Error(data.error || 'Booking failed')
      }
      setBookingId(data.appointmentId)
    } catch (err) { setError(err.message || 'Could not connect. Please try again.') }
    finally { setLoading(false) }
  }
  const when = date ? new Date(`${date}T12:00:00+01:00`).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' }) : ''
  if (!services.length) return <p className="text-gray-600">This provider hasn’t added bookable services yet. Check back soon.</p>
  if (bookingId) return <div role="status" className="space-y-4 text-center">
    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700"><Icon name="check" className="h-7 w-7" /></span>
    <h3 className="text-xl font-bold">Booking requested!</h3>
    <p className="text-sm text-gray-600">{businessName} will confirm your appointment. You can track its status in My bookings.</p>
    <div className="rounded-xl bg-gray-50 p-4 text-left text-sm"><strong>{selectedService.serviceName}</strong><p>{when} · {time} WAT</p><p>Booking #{bookingId}</p></div>
    <Link href="/bookings" className="btn-primary w-full">View my bookings</Link>
    <button className="btn-outline w-full" onClick={() => { setBookingId(null); setReview(false); setDate(''); setTime('') }}>Book another</button>
  </div>
  return <form onSubmit={submit} className="space-y-5" aria-busy={loading}>
    <ol aria-label="Booking steps" className="flex items-center gap-3 text-sm"><li className={!review ? 'font-semibold text-brand-700' : 'text-gray-600'}>1. Choose a time</li><li aria-hidden="true" className="text-gray-300">/</li><li className={review ? 'font-semibold text-brand-700' : 'text-gray-600'}>2. Review</li></ol>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {review ? <div className="space-y-4">
      <h3 ref={reviewHeading} tabIndex={-1} className="text-lg font-semibold outline-none">Review your booking</h3>
      <dl className="space-y-3 rounded-xl border border-gray-200 p-4 text-sm">
        {[["Service", selectedService.serviceName], ["Provider", businessName], ["Location", location || 'Contact your provider'], ["Date", when], ["Time", `${time} WAT`], ["Duration", `${selectedService.durationMin} minutes`]].map(([label, value]) => <div key={label}><dt className="text-gray-500">{label}</dt><dd className="font-medium">{value}</dd></div>)}
        <div className="flex justify-between border-t border-gray-200 pt-3"><dt className="font-semibold">Service total</dt><dd className="font-bold text-brand-700">₦{selectedService.price.toLocaleString()}</dd></div>
      </dl>
      <p className="text-sm text-gray-600">No online payment is collected. Payment arrangements are agreed directly with your provider.</p>
      <button type="button" disabled={loading} className="btn-outline w-full" onClick={() => setReview(false)}>Edit selection</button>
    </div> : <>
      <div><label htmlFor="booking-service" className="label">Select service</label><select id="booking-service" className="input" value={serviceId} onChange={e => setServiceId(e.target.value)} required>{services.map(s => <option key={s.id} value={s.id}>{s.serviceName} — ₦{s.price.toLocaleString()}</option>)}</select></div>
      {selectedService && <div className="flex justify-between rounded-xl bg-brand-50 p-4 text-sm"><span className="flex items-center gap-2 text-brand-800"><Icon name="clock" />{selectedService.durationMin} min</span><strong className="text-brand-800">₦{selectedService.price.toLocaleString()}</strong></div>}
      <div><label htmlFor="booking-date" className="label">Date</label><input id="booking-date" className="input" type="date" min={today} value={date} onChange={e => setDate(e.target.value)} required /></div>
      <div><label htmlFor="booking-time" className="label">Available time</label><select id="booking-time" className="input" value={time} onChange={e => setTime(e.target.value)} required disabled={!date || checking || !!availabilityError} aria-describedby="availability-hint"><option value="">{checking ? 'Checking availability…' : 'Choose a time slot'}</option>{slots.map(s => <option key={s.time} value={s.time} disabled={!s.available}>{s.time}{s.available ? '' : ' · Unavailable'}</option>)}</select>
        <p id="availability-hint" role="status" className="mt-2 text-sm text-gray-600">{!date ? 'Choose a date to see available times.' : checking ? 'Checking your provider’s calendar…' : !availabilityError && !slots.some(s => s.available) ? 'No times available on this date. Try another day.' : 'All times are Nigeria time (WAT).'}</p>
        {availabilityError && <div role="alert" className="mt-2 text-sm text-red-700"><p>{availabilityError}</p><button type="button" className="btn-outline mt-2" onClick={() => setRetry(n => n + 1)}>Try again</button></div>}
      </div>
    </>}
    <button type="submit" className="btn-primary w-full" disabled={loading || checking || !time || !!availabilityError}>{loading ? 'Sending request…' : review ? 'Confirm booking' : 'Review booking'}</button>
    <p className="text-center text-xs text-gray-600">Your booking is pending until the provider confirms.</p>
  </form>
}
