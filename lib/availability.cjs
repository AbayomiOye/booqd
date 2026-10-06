const DEFAULT_HOURS = Array.from({ length: 7 }, () => ({ open: '09:00', close: '18:00', closed: false }))
const isTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):(00|30)$/.test(value)
const minutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3))
function validDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const day = new Date(`${date}T12:00:00+01:00`)
  return !Number.isNaN(day.getTime()) && day.toISOString().slice(0, 10) === date
}
function validateHours(hours) {
  return Array.isArray(hours) && hours.length === 7 && hours.every(h => h && typeof h.closed === 'boolean' && isTime(h.open) && isTime(h.close) && minutes(h.close) > minutes(h.open))
}
function getSlots({ date, durationMin, openingHours, busy = [], now = new Date() }) {
  if (!validDate(date) || !Number.isInteger(durationMin) || durationMin < 1) return []
  const hours = validateHours(openingHours) ? openingHours : DEFAULT_HOURS
  const day = hours[new Date(`${date}T12:00:00+01:00`).getUTCDay()]
  if (day.closed) return []
  const slots = []
  for (let m = minutes(day.open); m + durationMin <= minutes(day.close); m += 30) {
    const time = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    const start = new Date(`${date}T${time}:00+01:00`)
    const end = new Date(start.getTime() + durationMin * 60000)
    slots.push({ time, available: start > now && !busy.some(b => start < new Date(b.endsAt) && end > new Date(b.apptDate)) })
  }
  return slots
}
module.exports = { DEFAULT_HOURS, validateHours, validDate, getSlots }
