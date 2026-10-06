// Call inside the same transaction as the action so the log cannot drift.
export function recordActivity(tx, actorId, action, summary, metadata) {
  return tx.activity.create({ data: { actorId, action, summary, ...(metadata ? { metadata } : {}) } })
}
