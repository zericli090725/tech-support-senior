export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { errors?: { message?: string }[] } }).data
    const fromData = data?.errors?.[0]?.message
    if (fromData) return fromData
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export type ActionState = {
  error?: string
} | null
