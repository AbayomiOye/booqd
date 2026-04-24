// app/providers/[id]/BookingForm.js
'use client'
import { useState } from 'react'

export default function BookingForm({ services, providerId, clientId }) {
  const [serviceId, setServiceId] = useState(services[0]?.id || '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const selectedService = services.find(s => s.id === parseInt(serviceId))

  // Generate available time slots (9am–6pm, every 30min)
  const slots = []
  for (let h = 9; h < 18; h++) {
    slots.push(`${String(h).padStart(2,'0')}:00`)
    slots.push(`${String(h).padStart(2,'0')}:30`)
  }

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e) {
    e.preventDefault()
    if (!serviceId || !date || !time) { setError('Please fill all fields'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: parseInt(serviceId), providerId, clientId, date, time }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Booking failed'); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="font-bold text-gray-900 text-lg">Booking confirmed!</h3>
        <p className="text-gray-500 text-sm mt-2">
          Your appointment has been requested.<br />
          The provider will confirm shortly.
        </p>
        <button onClick={() => { setSuccess(false); setDate(''); setTime('') }}
          className="btn-outline mt-4 w-full">Book another</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">{error}</div>
      )}

      <div>
        <label className="label">Select service</label>
        <select className="input" value={serviceId} onChange={e => setServiceId(e.target.value)} required>
          {services.map(s => (
            <option key={s.id} value={s.id}>
              {s.serviceName} — ₦{s.price.toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {selectedService && (
        <div className="bg-brand-50 rounded-xl p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Duration</span>
            <span className="font-medium">{selectedService.durationMin} min</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-600">Price</span>
            <span className="font-bold text-brand-700">₦{selectedService.price.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div>
        <label className="label">Date</label>
        <input className="input" type="date" min={today} value={date} onChange={e => setDate(e.target.value)} required />
      </div>

      <div>
        <label className="label">Time</label>
        <select className="input" value={time} onChange={e => setTime(e.target.value)} required>
          <option value="">Choose a time slot</option>
          {slots.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
        {loading ? 'Booking...' : 'Confirm booking'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Free cancellation up to 24 hours before your appointment
      </p>
    </form>
  )
}
