export const seniorContactMethods = ['cell', 'email', 'center'] as const

export type SeniorContactMethod = (typeof seniorContactMethods)[number]

export function seniorFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, ' ').trim()
}

export function splitSeniorName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: 'Senior', lastName: 'Member' }
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1] || parts[0],
  }
}

export function normalizeSeniorContact(
  method: string,
  contact: string,
): { contactMethod: SeniorContactMethod; contact: string | null } | { error: string } {
  if (method === 'center') return { contactMethod: 'center', contact: null }

  const trimmed = contact.trim()
  if (method === 'cell') {
    if (trimmed.replace(/\D/g, '').length < 7) return { error: 'Enter a cell number.' }
    return { contactMethod: 'cell', contact: trimmed }
  }

  if (method === 'email') {
    const email = trimmed.toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter an email address.' }
    return { contactMethod: 'email', contact: email }
  }

  return { error: 'Choose how to reach this senior.' }
}
