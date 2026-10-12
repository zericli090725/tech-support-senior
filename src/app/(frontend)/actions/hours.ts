'use server'

import { revalidatePath } from 'next/cache'

import { requireStudent } from '@/lib/auth'
import { getErrorMessage, type ActionState } from '@/lib/errors'

export async function logHours(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const hours = Number(formData.get('hours'))
  const date = String(formData.get('date') || '')
  const notes = String(formData.get('notes') || '').trim()
  const ticket = String(formData.get('ticket') || '')
  const event = String(formData.get('event') || '')

  if (!Number.isFinite(hours) || hours <= 0) {
    return { error: 'Enter hours greater than 0.' }
  }
  if (!date) return { error: 'Choose a date.' }

  try {
    const { user, payload } = await requireStudent()
    await payload.create({
      collection: 'hour-logs',
      data: {
        student: user.id,
        hours,
        date,
        notes: notes || undefined,
        ticket: ticket || undefined,
        event: event || undefined,
      },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not save this hour log.') }
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return null
}

export async function deleteHourLog(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get('id') || '')
  if (!id) return { error: 'Missing hour log.' }

  try {
    const { user, payload } = await requireStudent()
    await payload.delete({
      collection: 'hour-logs',
      id,
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not delete this hour log.') }
  }

  revalidatePath('/profile')
  return null
}
