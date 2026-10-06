const { test } = require('node:test')
const assert = require('node:assert/strict')
const { parseBooking, canTransition } = require('../lib/booking-rules.cjs')
const now = new Date('2026-10-06T10:00:00Z')
const valid = { serviceId: 1, providerId: 2, date: '2026-10-07', time: '09:00' }
test('Nigeria appointment time has a stable UTC representation', () => {
  assert.equal(parseBooking(valid, now).apptDate.toISOString(), '2026-10-07T08:00:00.000Z')
})
test('rejects malformed, past, impossible and out-of-hours bookings', () => {
  for (const change of [{ serviceId: '1' }, { providerId: -1 }, { date: '2026-02-30' }, { date: '2026-10-05' }, { time: '25:00' }, { time: '08:30' }, { time: '09:15' }]) {
    assert.throws(() => parseBooking({ ...valid, ...change }, now))
  }
})
test('closed bookings cannot be revived and pending bookings cannot be completed', () => {
  assert.equal(canTransition('PENDING', 'CONFIRMED'), true)
  assert.equal(canTransition('CONFIRMED', 'COMPLETED'), true)
  assert.equal(canTransition('PENDING', 'CANCELLED'), true)
  assert.equal(canTransition('PENDING', 'COMPLETED'), false)
  assert.equal(canTransition('CANCELLED', 'CONFIRMED'), false)
  assert.equal(canTransition('COMPLETED', 'CANCELLED'), false)
})
