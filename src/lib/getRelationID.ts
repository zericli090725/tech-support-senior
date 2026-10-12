export function getRelationID(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id: string | number }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return undefined
}
