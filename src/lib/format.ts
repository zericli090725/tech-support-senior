export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return 'TBD'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return 'TBD'
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return 'TBD'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return 'TBD'
  return date.toLocaleDateString('en-US', { dateStyle: 'medium' })
}

export function formatHours(hours: number): string {
  const rounded = Math.round(hours * 100) / 100
  return `${rounded} ${rounded === 1 ? 'hour' : 'hours'}`
}

export const deviceLabels: Record<string, string> = {
  phone: 'Phone',
  tablet: 'Tablet',
  computer: 'Computer',
  tv: 'TV',
  other: 'Other',
}

export const ticketStatusLabels: Record<string, string> = {
  open: 'Open',
  assigned: 'Assigned',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const membershipStatusLabels: Record<string, string> = {
  pending: 'Pending approval',
  approved: 'Approved',
  rejected: 'Not approved',
}

export const roleLabels: Record<string, string> = {
  'super-admin': 'Super admin',
  staff: 'Center staff',
}

export const contactMethodLabels: Record<string, string> = {
  cell: 'Cell',
  email: 'Email',
  center: 'Through the center',
}

export function formatSeniorContact(method?: string | null, contact?: string | null): string {
  if (method === 'cell') return contact ? `Cell · ${contact}` : 'Cell'
  if (method === 'email') return contact ? `Email · ${contact}` : 'Email'
  return 'Through the center'
}

export function formatBytes(size?: number | null): string {
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

/** Calendar date prefix from a stored date, without shifting across timezones. */
export function dateInputFromStored(value?: string | null): string {
  if (!value) return ''
  return /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1] || ''
}

export function getDocName(doc: unknown, fallback = 'Unknown'): string {
  if (doc && typeof doc === 'object') {
    if ('name' in doc && typeof doc.name === 'string') return doc.name
    if ('title' in doc && typeof doc.title === 'string') return doc.title
    if ('seniorName' in doc && typeof doc.seniorName === 'string') return doc.seniorName
  }
  return fallback
}

export function getDocTitle(doc: unknown, fallback = 'Untitled'): string {
  return getDocName(doc, fallback)
}
