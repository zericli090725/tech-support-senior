'use server'

import { revalidatePath } from 'next/cache'

import { requireStudent } from '@/lib/auth'
import { getErrorMessage, type ActionState } from '@/lib/errors'

export async function joinCenter(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const centerId = String(formData.get('centerId') || '')
  if (!centerId) return { error: 'Choose a center to join.' }

  try {
    const { user, payload } = await requireStudent()
    await payload.create({
      collection: 'center-memberships',
      data: {
        student: user.id,
        center: centerId,
        status: 'pending',
      },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not request to join this center.') }
  }

  revalidatePath('/centers')
  revalidatePath('/dashboard')
  return null
}
