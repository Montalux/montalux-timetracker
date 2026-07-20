// Local YYYY-MM-DD, unlike toISOString() which shifts to UTC and can land
// on the wrong calendar day around midnight in Swiss time.
export function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
