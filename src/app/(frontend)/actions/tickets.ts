'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { isAdminUser, isStudent } from '@/access/roles'
import { getAuth, requireStudent } from '@/lib/auth'
import { getErrorMessage, type ActionState } from '@/lib/errors'
import { getRelationID } from '@/lib/getRelationID'

const ticketStatuses = ['open', 'assigned', 'completed', 'cancelled'] as const

type TicketStatus = (typeof ticketStatuses)[number]

function oneOf(value: string, allowed: readonly TicketStatus[]): TicketStatus | undefined {
  return allowed.find((item) => item === value)
}

export async function claimTicket(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ticketId = String(formData.get('ticketId') || '')
  if (!ticketId) return { error: 'Missing ticket.' }

  try {
    const { user, payload } = await requireStudent()
    await payload.update({
      collection: 'tickets',
      id: ticketId,
      data: {
        assignedStudent: user.id,
        status: 'assigned',
      },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not claim this ticket.') }
  }

  revalidatePath('/tickets')
  revalidatePath('/dashboard')
  revalidatePath(`/tickets/${ticketId}`)
  redirect(`/tickets/${ticketId}`)
}

export async function addTicketNote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ticketId = String(formData.get('ticketId') || '')
  const body = String(formData.get('body') || '').trim()
  const status = oneOf(String(formData.get('status') || ''), ticketStatuses)
  if (!ticketId) return { error: 'Missing ticket.' }
  if (!body) return { error: 'Write a note.' }
  if (!status) return { error: 'Choose a valid status.' }

  const { user, payload } = await getAuth()
  if (!user || (!isStudent(user) && !isAdminUser(user))) {
    return { error: 'Sign in to add a note.' }
  }

  try {
    const ticket = await payload.findByID({
      collection: 'tickets',
      id: ticketId,
      depth: 0,
      user,
      overrideAccess: false,
    })

    if (status === 'assigned' && !getRelationID(ticket.assignedStudent)) {
      return { error: 'Assign a student before marking this ticket assigned.' }
    }

    const note = await payload.create({
      collection: 'ticket-notes',
      data: {
        ticket: ticketId,
        body,
        status,
        authorName: 'Pending',
        authorRole: isStudent(user) ? 'student' : 'staff',
      },
      user,
      overrideAccess: false,
    })

    if (status !== ticket.status) {
      try {
        await payload.update({
          collection: 'tickets',
          id: ticketId,
          data: { status },
          user,
          overrideAccess: false,
        })
      } catch (error) {
        await payload.delete({
          collection: 'ticket-notes',
          id: note.id,
          overrideAccess: true,
        })
        throw error
      }
    }
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not add this note.') }
  }

  revalidatePath('/tickets')
  revalidatePath('/dashboard')
  revalidatePath('/staff/tickets')
  revalidatePath(`/tickets/${ticketId}`)
  revalidatePath(`/staff/tickets/${ticketId}`)
  return null
}
