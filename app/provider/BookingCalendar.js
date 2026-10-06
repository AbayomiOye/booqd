'use client'
import { useState } from 'react'
const key = value => new Date(new Date(value).getTime() + 3600000).toISOString().slice(0, 10)
export default function BookingCalendar({ appointments, onSelect }) {
  const today = key(new Date())
  const [month, setMonth] = useState(today.slice(0, 7))
  const [selected, setSelected] = useState('')
  const first = new Date(`${month}-01T12:00:00Z`)
  const count = new Date(first.getUTCFullYear(), first.getUTCMonth() + 1, 0).getDate()
  const offset = first.getUTCDay()
  function move(amount) { const next = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + amount, 1)); setMonth(next.toISOString().slice(0, 7)) }
  return <div className="-mx-6 mb-6 border-y border-gray-200 p-3 sm:mx-0 sm:rounded-xl sm:border sm:p-5"><div className="mb-4 flex items-center justify-between gap-2"><button type="button" className="btn-ghost" aria-label="Previous month" onClick={() => move(-1)}>←</button><h3 className="font-semibold">{first.toLocaleDateString('en-NG', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h3><button type="button" className="btn-ghost" aria-label="Next month" onClick={() => move(1)}>→</button></div><div className="grid grid-cols-7 text-center text-sm">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-2 text-xs text-gray-600">{d}</div>)}{Array.from({ length: offset }, (_, i) => <div key={`empty-${i}`} />)}{Array.from({ length: count }, (_, i) => { const date = `${month}-${String(i + 1).padStart(2, '0')}`; const booked = appointments.filter(a => key(a.apptDate) === date && a.status !== 'CANCELLED').length; return <button key={date} type="button" aria-label={`${date}, ${booked} appointments`} aria-pressed={selected === date} className={`flex min-h-12 min-w-0 flex-col items-center justify-center rounded-lg ${selected === date ? 'bg-brand-600 text-white' : date === today ? 'bg-brand-50 text-brand-800' : 'hover:bg-gray-50'}`} onClick={() => { setSelected(date); onSelect(date) }}><span>{i + 1}</span><span className={`mt-1 h-1 w-1 rounded-full ${booked ? selected === date ? 'bg-white' : 'bg-brand-600' : 'bg-transparent'}`} /></button> })}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600"><p>A dot marks a day with appointments.</p><button className="btn-ghost text-sm" type="button" onClick={() => { setSelected(''); onSelect('') }}>Show all dates</button></div></div>
}
