import type { Where } from 'payload'

export const PAGE_SIZE = 20

export function readPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number(raw)
  if (!Number.isInteger(page) || page < 1) return 1
  return page
}

export function readParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value
  return raw?.trim() || ''
}

export function andWhere(parts: Array<Where | undefined | false | null>): Where | undefined {
  const present = parts.filter((part): part is Where => Boolean(part))
  if (present.length === 0) return undefined
  if (present.length === 1) return present[0]
  return { and: present }
}

export function searchWhere(fields: string[], query: string): Where | undefined {
  if (!query) return undefined
  return {
    or: fields.map((field) => ({ [field]: { contains: query } })),
  }
}

export function oneOf<T extends string>(value: string, allowed: readonly T[]): T | undefined {
  return allowed.find((item) => item === value)
}
