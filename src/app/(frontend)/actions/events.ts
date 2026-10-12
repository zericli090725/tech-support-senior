'use server'

import { revalidatePath } from 'next/cache'

import { requireStudent } from '@/lib/auth'
import { getErrorMessage, type ActionState } from '@/lib/errors'

export async function rsvpToEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = String(formData.get('eventId') || '')
  if (!eventId) return { error: 'Missing event.' }

  try {
    const { user, payload } = await requireStudent()
    await payload.create({
      collection: 'event-rsvps',
      data: {
        event: eventId,
        student: user.id,
        status: 'going',
      },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not RSVP to this event.') }
  }

  revalidatePath('/events')
  revalidatePath('/dashboard')
  revalidatePath(`/events/${eventId}`)
  return null
}

export async function cancelRsvp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rsvpId = String(formData.get('rsvpId') || '')
  if (!rsvpId) return { error: 'Missing RSVP.' }

  try {
    const { user, payload } = await requireStudent()
    await payload.update({
      collection: 'event-rsvps',
      id: rsvpId,
      data: { status: 'cancelled' },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not cancel this RSVP.') }
  }

  revalidatePath('/events')
  revalidatePath('/dashboard')
  return null
}
