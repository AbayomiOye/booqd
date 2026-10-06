function parseBooking({ serviceId, providerId, date, time }, now = new Date()) {
  if (!Number.isSafeInteger(serviceId) || serviceId < 1 || !Number.isSafeInteger(providerId) || providerId < 1) throw new Error('Invalid service or provider')
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof time !== 'string' || !/^(09|1[0-7]):(00|30)$/.test(time)) throw new Error('Choose a valid date and time between 09:00 and 17:30 WAT')
  const apptDate = new Date(`${date}T${time}:00+01:00`)
  if (Number.isNaN(apptDate.getTime()) || new Date(apptDate.getTime() + 3600000).toISOString().slice(0, 10) !== date) throw new Error('Invalid date')
  if (apptDate <= now) throw new Error('Appointment must be in the future')
  return { serviceId, providerId, apptDate }
}
function canTransition(from, to) {
  return (from === 'PENDING' && ['CONFIRMED', 'CANCELLED'].includes(to)) || (from === 'CONFIRMED' && ['COMPLETED', 'CANCELLED'].includes(to))
}
module.exports = { parseBooking, canTransition }
