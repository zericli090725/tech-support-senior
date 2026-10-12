export function toDateTimeLocal(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function todayDateInput(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

export function stampLocalDateTimes(formData: FormData, fields: string[]) {
  for (const field of fields) {
    const value = String(formData.get(field) || '').trim()
    if (!value) continue
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) continue
    formData.set(field, parsed.toISOString())
  }
}
