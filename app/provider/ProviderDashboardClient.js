// app/provider/ProviderDashboardClient.js
'use client'
import { useState } from 'react'
import WorkingHours from './WorkingHours'
import BookingCalendar from './BookingCalendar'

const statusColors = {
  PENDING:   'badge-yellow',
  CONFIRMED: 'badge-green',
  CANCELLED: 'badge-red',
  COMPLETED: 'badge-gray',
}

function AppointmentsTab({ appointments }) {
  const [appts, setAppts] = useState(appointments)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [view, setView] = useState('list')
  const [selectedDate, setSelectedDate] = useState('')

  async function updateStatus(id, status) {
    setError(''); setBusy(id)
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not update booking')
      setAppts(prev => prev.map(a => a.id === id ? { ...a, status: data.status } : a))
    } catch (err) { setError(err.message) } finally { setBusy(null) }
  }

  const visible = view === 'calendar' && selectedDate ? appts.filter(a => new Date(new Date(a.apptDate).getTime() + 3600000).toISOString().slice(0, 10) === selectedDate) : appts
  const upcoming = visible.filter(a => ['PENDING','CONFIRMED'].includes(a.status))
  const past = visible.filter(a => ['COMPLETED','CANCELLED'].includes(a.status))

  const ApptRow = ({ a }) => (
    <div className="py-4 flex flex-wrap items-start gap-4 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-40">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900">{a.client.name}</span>
          <span className={statusColors[a.status] || 'badge-gray'}>{a.status}</span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{a.serviceName}</p>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date(a.apptDate).toLocaleDateString('en-NG', { timeZone:'Africa/Lagos', weekday:'short', day:'numeric', month:'short', year:'numeric' })}
          {' · '}
          {new Date(a.apptDate).toLocaleTimeString('en-NG', { timeZone:'Africa/Lagos', hour:'2-digit', minute:'2-digit' })}
        </p>
      </div>
      {a.status === 'PENDING' && (
        <div className="flex gap-2 shrink-0">
          <button disabled={busy !== null} onClick={() => updateStatus(a.id, 'CONFIRMED')}
            className="text-xs btn-primary py-1.5 px-3">Confirm</button>
          <button disabled={busy !== null} onClick={() => updateStatus(a.id, 'CANCELLED')}
            className="text-xs btn-ghost text-red-600 hover:bg-red-50 py-1.5 px-3">Decline</button>
        </div>
      )}
      {a.status === 'CONFIRMED' && (
        <button disabled={busy !== null} onClick={() => updateStatus(a.id, 'COMPLETED')}
          className="text-xs btn-outline py-1.5 px-3 shrink-0">Mark done</button>
      )}
    </div>
  )

  return (
    <div className="card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Appointments</h2><div className="flex gap-2">{['list', 'calendar'].map(v => <button key={v} className={view === v ? 'btn-primary' : 'btn-outline'} aria-pressed={view === v} onClick={() => setView(v)}>{v === 'list' ? 'List' : 'Calendar'}</button>)}</div></div>
      {view === 'calendar' && <BookingCalendar appointments={appts} onSelect={setSelectedDate} />}
      {selectedDate && view === 'calendar' && <p className="mb-4 text-sm text-gray-600">Appointments on {selectedDate}</p>}
      {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
      {upcoming.length === 0 && past.length === 0 ? (
        <div className="text-center py-10 text-gray-400">

          <p>{selectedDate && view === 'calendar' ? 'No appointments on this date' : 'No appointments yet'}</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming</h3>
              {upcoming.map(a => <ApptRow key={a.id} a={a} />)}
            </>
          )}
          {past.length > 0 && (
            <div className={upcoming.length > 0 ? 'mt-6' : ''}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Past</h3>
              {past.map(a => <ApptRow key={a.id} a={a} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ServicesTab({ services, providerId }) {
  const [list, setList] = useState(services)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ serviceName:'', description:'', durationMin:60, price:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function addService(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, providerId, durationMin: Number(form.durationMin), price: Number(form.price) }) })
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Could not save service')
      setList(prev => [...prev, data]); setAdding(false); setForm({ serviceName: '', description: '', durationMin: 60, price: '' })
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  async function deleteService(id) {
    if (!confirm('Delete this service?')) return
    setError('')
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Could not remove service')
      setList(prev => prev.filter(s => s.id !== id))
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Your Services</h3>
        <button onClick={() => setAdding(!adding)} className="btn-primary text-sm py-1.5">
          {adding ? 'Cancel' : '+ Add service'}
        </button>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      {adding && (
        <form onSubmit={addService} className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="field-1" className="label text-xs">Service name</label>
              <input id="field-1" className="input" placeholder="e.g. Bridal Makeup" value={form.serviceName} onChange={e => set('serviceName', e.target.value)} required />
            </div>
            <div>
              <label htmlFor="field-2" className="label text-xs">Price (₦)</label>
              <input id="field-2" className="input" type="number" min="0" step="0.01" placeholder="15000" value={form.price} onChange={e => set('price', e.target.value)} required />
            </div>
            <div>
              <label htmlFor="field-3" className="label text-xs">Duration (minutes)</label>
              <input id="field-3" className="input" type="number" min="1" max="1440" value={form.durationMin} onChange={e => set('durationMin', e.target.value)} required />
            </div>
            <div>
              <label htmlFor="field-4" className="label text-xs">Description (optional)</label>
              <input id="field-4" className="input" placeholder="Brief description..." value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary text-sm" disabled={loading}>
            {loading ? 'Saving...' : 'Save service'}
          </button>
        </form>
      )}

      {list.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No services added yet</p>
          <p className="text-sm mt-1">Add your first service to start receiving bookings</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {list.map(s => (
            <div key={s.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">{s.serviceName}</p>
                <p className="text-sm text-gray-500">{s.durationMin} min · ₦{s.price.toLocaleString()}</p>
              </div>
              <button onClick={() => deleteService(s.id)}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProviderDashboardClient({ provider, providerId }) {
  const [tab, setTab] = useState('appointments')
  const tabs = [
    { id: 'appointments', label: 'Appointments' },
    { id: 'services',     label: 'Services' },
    { id: 'portfolio',    label: 'Portfolio' },
    { id: 'hours', label: 'Working hours' },
  ]

  return (
    <>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
        {tabs.map(t => (
          <button key={t.id} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}
            className={`min-h-11 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'appointments' && <AppointmentsTab appointments={provider.appointments} />}
      {tab === 'hours' && <WorkingHours initialHours={provider.openingHours} />}
      {tab === 'services' && <ServicesTab services={provider.services} providerId={providerId} />}
      {tab === 'portfolio' && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Portfolio</h3>
          {provider.portfolios.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No portfolio images yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {provider.portfolios.map(p => (
                <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={p.imageUrl} alt={p.caption || ''} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-500 text-center">
            Portfolio image upload via URL coming in v2 — or contact admin to add images
          </div>
        </div>
      )}
    </>
  )
}
