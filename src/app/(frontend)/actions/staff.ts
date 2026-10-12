'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getStaffCenterID } from '@/access/getStaffCenterID'
import { isStaff, isSuperAdmin } from '@/access/roles'
import { requireStaff } from '@/lib/auth'
import { getErrorMessage, type ActionState } from '@/lib/errors'
import { getRelationID } from '@/lib/getRelationID'
import { normalizeSeniorContact, seniorFullName } from '@/lib/seniors'
import type { Event, HourLog, Ticket } from '@/payload-types'

const ticketStatuses = ['open', 'assigned', 'completed', 'cancelled'] as const
const membershipStatuses = ['pending', 'approved', 'rejected'] as const
const devices = ['phone', 'tablet', 'computer', 'tv', 'other'] as const

type TicketStatus = (typeof ticketStatuses)[number]
type MembershipStatus = (typeof membershipStatuses)[number]

function refreshSite() {
  revalidatePath('/', 'layout')
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) || '').trim()
}

function optionalText(formData: FormData, name: string): string | null {
  return text(formData, name) || null
}

function optionalId(formData: FormData, name: string): string | null {
  return text(formData, name) || null
}

function parseDateTime(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function oneOf<T extends string>(value: string, allowed: readonly T[]): T | undefined {
  return allowed.find((item) => item === value)
}

async function readUpload(formData: FormData) {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return null
  const data = Buffer.from(await file.arrayBuffer())
  return {
    data,
    mimetype: file.type || 'application/octet-stream',
    name: file.name || 'upload',
    size: file.size,
  }
}

function passwords(formData: FormData, required: boolean): { password?: string; error?: string } {
  const password = String(formData.get('password') || '')
  const confirm = String(formData.get('confirmPassword') || '')
  if (!password && !confirm) {
    if (required) return { error: 'Enter a password.' }
    return {}
  }
  if (password !== confirm) return { error: 'Passwords do not match.' }
  if (password.length < 3) return { error: 'Password must be at least 3 characters.' }
  return { password }
}

export async function saveTicket(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  const existingId = optionalId(formData, 'id')
  const issue = text(formData, 'issue')
  if (!issue) return { error: 'Describe the issue.' }

  const status = oneOf(text(formData, 'status') || 'open', ticketStatuses)
  if (!status) return { error: 'Choose a valid status.' }

  const scheduledRaw = text(formData, 'scheduledAt')
  const scheduledAt = parseDateTime(scheduledRaw)
  if (scheduledRaw && !scheduledAt) return { error: 'Enter a valid appointment time.' }

  const assignedStudent = optionalId(formData, 'assignedStudent')
  if (status === 'assigned' && !assignedStudent) {
    return { error: 'Choose a student before marking this ticket assigned.' }
  }

  const center = isStaff(user) ? getStaffCenterID(user) : optionalId(formData, 'center')
  if (!center) return { error: 'Choose a center.' }

  let senior = optionalId(formData, 'senior')
  let seniorName = text(formData, 'seniorName')
  const creatingSenior = text(formData, 'newSenior') === '1'

  if (creatingSenior) {
    const firstName = text(formData, 'firstName')
    const lastName = text(formData, 'lastName')
    if (!firstName || !lastName) return { error: 'Enter the senior’s first and last name.' }
    const parsed = normalizeSeniorContact(text(formData, 'contactMethod') || 'center', text(formData, 'contact'))
    if ('error' in parsed) return { error: parsed.error }

    try {
      const createdSenior = await payload.create({
        collection: 'seniors',
        data: {
          firstName,
          lastName,
          name: seniorFullName(firstName, lastName),
          contactMethod: parsed.contactMethod,
          contact: parsed.contact,
          center,
        },
        user,
        overrideAccess: false,
      })
      senior = String(createdSenior.id)
      seniorName = createdSenior.name
    } catch (error) {
      return { error: getErrorMessage(error, 'Could not save this senior.') }
    }
  } else if (senior) {
    try {
      const profile = await payload.findByID({
        collection: 'seniors',
        id: senior,
        depth: 0,
        user,
        overrideAccess: false,
      })
      if (getRelationID(profile.center) !== center) {
        return { error: 'Choose a senior from this center.' }
      }
      seniorName = profile.name
    } catch (error) {
      return { error: getErrorMessage(error, 'Choose a senior at this center.') }
    }
  }

  if (!seniorName) return { error: 'Choose a senior or add a profile.' }

  const data: Omit<Ticket, 'id' | 'updatedAt' | 'createdAt' | 'createdBy'> = {
    seniorName,
    senior,
    issue,
    seniorNotes: optionalText(formData, 'seniorNotes'),
    device: oneOf(text(formData, 'device'), devices) || null,
    center,
    event: optionalId(formData, 'event'),
    scheduledAt,
    assignedStudent,
    status: status as TicketStatus,
  }

  let destination = existingId ? `/staff/tickets/${existingId}` : '/staff/tickets'
  try {
    if (existingId) {
      await payload.update({
        collection: 'tickets',
        id: existingId,
        data,
        user,
        overrideAccess: false,
      })
    } else {
      const created = await payload.create({
        collection: 'tickets',
        data,
        user,
        overrideAccess: false,
      })
      destination = `/staff/tickets/${created.id}`
    }
  } catch (error) {
    if (creatingSenior && senior) {
      await payload.delete({ collection: 'seniors', id: senior, overrideAccess: true }).catch(() => undefined)
    }
    return { error: getErrorMessage(error, 'Could not save this ticket.') }
  }

  refreshSite()
  redirect(destination)
}

export async function deleteTicket(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  const id = optionalId(formData, 'id')
  if (!id) return { error: 'Missing ticket.' }

  try {
    await payload.delete({ collection: 'tickets', id, user, overrideAccess: false })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not delete this ticket.') }
  }

  refreshSite()
  redirect('/staff/tickets')
}

export async function saveEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  const existingId = optionalId(formData, 'id')
  const title = text(formData, 'title')
  if (!title) return { error: 'Enter a title.' }

  const startsRaw = text(formData, 'startsAt')
  const startsAt = parseDateTime(startsRaw)
  if (!startsAt) return { error: 'Enter a start time.' }

  const endsRaw = text(formData, 'endsAt')
  const endsAt = parseDateTime(endsRaw)
  if (endsRaw && !endsAt) return { error: 'Enter a valid end time.' }
  if (endsAt && new Date(endsAt) < new Date(startsAt)) {
    return { error: 'The end time must be after the start time.' }
  }

  const maxRaw = text(formData, 'maxStudents')
  let maxStudents: number | null = null
  if (maxRaw) {
    maxStudents = Number(maxRaw)
    if (!Number.isInteger(maxStudents) || maxStudents < 1) {
      return { error: 'Student cap must be a whole number of at least 1.' }
    }
  }

  const center = isStaff(user) ? getStaffCenterID(user) : optionalId(formData, 'center')
  if (!center) return { error: 'Choose a center.' }

  const data: Pick<
    Event,
    'title' | 'center' | 'startsAt' | 'endsAt' | 'locationInCenter' | 'maxStudents' | 'description'
  > = {
    title,
    center,
    startsAt,
    endsAt,
    locationInCenter: optionalText(formData, 'locationInCenter'),
    maxStudents,
    description: optionalText(formData, 'description'),
  }

  let destination = existingId ? `/staff/events/${existingId}` : '/staff/events'
  try {
    if (existingId) {
      await payload.update({
        collection: 'events',
        id: existingId,
        data,
        user,
        overrideAccess: false,
      })
    } else {
      const created = await payload.create({
        collection: 'events',
        data,
        user,
        overrideAccess: false,
      })
      destination = `/staff/events/${created.id}`
    }
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not save this event.') }
  }

  refreshSite()
  redirect(destination)
}

export async function deleteEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  const id = optionalId(formData, 'id')
  if (!id) return { error: 'Missing event.' }

  try {
    await payload.delete({ collection: 'events', id, user, overrideAccess: false })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not delete this event.') }
  }

  refreshSite()
  redirect('/staff/events')
}

export async function setMembershipStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  const id = optionalId(formData, 'id')
  const status = oneOf(text(formData, 'status'), membershipStatuses)
  if (!id || !status) return { error: 'Choose a valid membership status.' }

  try {
    await payload.update({
      collection: 'center-memberships',
      id,
      data: { status: status as MembershipStatus },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not update this membership.') }
  }

  refreshSite()
  return null
}

export async function createMembership(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  if (!isSuperAdmin(user)) return { error: 'Only a super admin can add a membership.' }

  const student = optionalId(formData, 'student')
  const center = optionalId(formData, 'center')
  const status = oneOf(text(formData, 'status') || 'approved', membershipStatuses)
  if (!student || !center || !status) return { error: 'Choose a student, center, and status.' }

  try {
    const existing = await payload.find({
      collection: 'center-memberships',
      where: { and: [{ student: { equals: student } }, { center: { equals: center } }] },
      limit: 1,
      depth: 0,
      user,
      overrideAccess: false,
    })
    if (existing.totalDocs > 0) {
      return { error: 'That student already has a membership at this center.' }
    }

    await payload.create({
      collection: 'center-memberships',
      data: { student, center, status },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not add this membership.') }
  }

  refreshSite()
  redirect('/staff/memberships')
}

export async function deleteMembership(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  if (!isSuperAdmin(user)) return { error: 'Only a super admin can remove a membership.' }
  const id = optionalId(formData, 'id')
  if (!id) return { error: 'Missing membership.' }

  try {
    await payload.delete({ collection: 'center-memberships', id, user, overrideAccess: false })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not remove this membership.') }
  }

  refreshSite()
  return null
}

export async function setRsvpStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  if (!isSuperAdmin(user)) return { error: 'Only a super admin can change RSVPs.' }
  const id = optionalId(formData, 'id')
  const status = text(formData, 'status') === 'cancelled' ? 'cancelled' : 'going'
  if (!id) return { error: 'Missing RSVP.' }

  try {
    await payload.update({
      collection: 'event-rsvps',
      id,
      data: { status },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not update this RSVP.') }
  }

  refreshSite()
  return null
}

export async function createRsvp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  if (!isSuperAdmin(user)) return { error: 'Only a super admin can add an RSVP.' }
  const event = optionalId(formData, 'event')
  const student = optionalId(formData, 'student')
  if (!event || !student) return { error: 'Choose a student.' }

  try {
    await payload.create({
      collection: 'event-rsvps',
      data: { event, student, status: 'going' },
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not add this RSVP.') }
  }

  refreshSite()
  redirect(`/staff/events/${event}`)
}

export async function deleteRsvp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  if (!isSuperAdmin(user)) return { error: 'Only a super admin can delete an RSVP.' }
  const id = optionalId(formData, 'id')
  if (!id) return { error: 'Missing RSVP.' }

  try {
    await payload.delete({ collection: 'event-rsvps', id, user, overrideAccess: false })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not delete this RSVP.') }
  }

  refreshSite()
  return null
}

export async function saveStudent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  if (!isSuperAdmin(user)) return { error: 'Only a super admin can edit student accounts.' }

  const existingId = optionalId(formData, 'id')
  const name = text(formData, 'name')
  const email = text(formData, 'email')
  if (!name) return { error: 'Enter a name.' }
  if (!email.includes('@')) return { error: 'Enter a valid email.' }

  const passwordResult = passwords(formData, !existingId)
  if (passwordResult.error) return { error: passwordResult.error }

  const data: { name: string; email: string; password?: string } = { name, email }
  if (passwordResult.password) data.password = passwordResult.password

  let destination = existingId ? `/staff/students/${existingId}` : '/staff/students'
  try {
    if (existingId) {
      await payload.update({
        collection: 'students',
        id: existingId,
        data,
        user,
        overrideAccess: false,
      })
    } else {
      const created = await payload.create({
        collection: 'students',
        data,
        user,
        overrideAccess: false,
      })
      destination = `/staff/students/${created.id}`
    }
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not save this student.') }
  }

  refreshSite()
  redirect(destination)
}

export async function deleteStudent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  if (!isSuperAdmin(user)) return { error: 'Only a super admin can delete a student.' }
  const id = optionalId(formData, 'id')
  if (!id) return { error: 'Missing student.' }

  try {
    await payload.delete({ collection: 'students', id, user, overrideAccess: false })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not delete this student.') }
  }

  refreshSite()
  redirect('/staff/students')
}

export async function saveHourLog(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  if (!isSuperAdmin(user)) return { error: 'Only a super admin can edit hour logs.' }

  const existingId = optionalId(formData, 'id')
  const student = optionalId(formData, 'student')
  const hours = Number(formData.get('hours'))
  const date = text(formData, 'date')
  if (!student) return { error: 'Choose a student.' }
  if (!Number.isFinite(hours) || hours < 0.25 || hours > 24) {
    return { error: 'Hours must be between 0.25 and 24.' }
  }
  if (!date) return { error: 'Choose a date.' }

  const data: Pick<HourLog, 'student' | 'hours' | 'date' | 'notes' | 'ticket' | 'event'> = {
    student,
    hours,
    date,
    notes: optionalText(formData, 'notes'),
    ticket: optionalId(formData, 'ticket'),
    event: optionalId(formData, 'event'),
  }

  let destination = existingId ? `/staff/hours/${existingId}` : '/staff/hours'
  try {
    if (existingId) {
      await payload.update({
        collection: 'hour-logs',
        id: existingId,
        data,
        user,
        overrideAccess: false,
      })
    } else {
      const created = await payload.create({
        collection: 'hour-logs',
        data,
        user,
        overrideAccess: false,
      })
      destination = `/staff/hours/${created.id}`
    }
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not save this hour log.') }
  }

  refreshSite()
  redirect(destination)
}

export async function deleteHourLogAsStaff(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  if (!isSuperAdmin(user)) return { error: 'Only a super admin can delete hour logs.' }
  const id = optionalId(formData, 'id')
  if (!id) return { error: 'Missing hour log.' }

  try {
    await payload.delete({ collection: 'hour-logs', id, user, overrideAccess: false })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not delete this hour log.') }
  }

  refreshSite()
  redirect('/staff/hours')
}

export async function saveSenior(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  const existingId = optionalId(formData, 'id')
  const firstName = text(formData, 'firstName')
  const lastName = text(formData, 'lastName')
  if (!firstName || !lastName) return { error: 'Enter a first and last name.' }

  const parsed = normalizeSeniorContact(text(formData, 'contactMethod') || 'center', text(formData, 'contact'))
  if ('error' in parsed) return { error: parsed.error }

  const center = existingId ? undefined : isStaff(user) ? getStaffCenterID(user) : optionalId(formData, 'center')
  if (!existingId && !center) {
    return { error: isStaff(user) ? 'Your account is not assigned to a center.' : 'Choose a center.' }
  }

  const data = {
    firstName,
    lastName,
    name: seniorFullName(firstName, lastName),
    contactMethod: parsed.contactMethod,
    contact: parsed.contact,
    ...(center ? { center } : {}),
  }

  let destination = existingId ? `/staff/seniors/${existingId}` : '/staff/seniors'
  try {
    if (existingId) {
      await payload.update({
        collection: 'seniors',
        id: existingId,
        data,
        user,
        overrideAccess: false,
      })
    } else {
      const created = await payload.create({
        collection: 'seniors',
        data: { ...data, center: center! },
        user,
        overrideAccess: false,
      })
      destination = `/staff/seniors/${created.id}`
    }
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not save this senior.') }
  }

  refreshSite()
  redirect(destination)
}

export async function deleteSenior(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  const id = optionalId(formData, 'id')
  if (!id) return { error: 'Missing senior.' }

  try {
    const linked = await payload.count({
      collection: 'tickets',
      where: { senior: { equals: id } },
      user,
      overrideAccess: false,
    })
    if (linked.totalDocs > 0) {
      return { error: 'Tickets are still linked to this profile. Keep it so the history stays together.' }
    }
    await payload.delete({ collection: 'seniors', id, user, overrideAccess: false })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not delete this senior.') }
  }

  refreshSite()
  redirect('/staff/seniors')
}

export async function saveCenter(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  if (!isSuperAdmin(user)) return { error: 'Only a super admin can edit centers.' }

  const existingId = optionalId(formData, 'id')
  const name = text(formData, 'name')
  if (!name) return { error: 'Enter a center name.' }

  const data = {
    name,
    address: optionalText(formData, 'address'),
    notes: optionalText(formData, 'notes'),
  }

  let destination = existingId ? `/staff/centers/${existingId}` : '/staff/centers'
  try {
    if (existingId) {
      await payload.update({
        collection: 'centers',
        id: existingId,
        data,
        user,
        overrideAccess: false,
      })
    } else {
      const created = await payload.create({
        collection: 'centers',
        data,
        user,
        overrideAccess: false,
      })
      destination = `/staff/centers/${created.id}`
    }
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not save this center.') }
  }

  refreshSite()
  redirect(destination)
}

export async function deleteCenter(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  if (!isSuperAdmin(user)) return { error: 'Only a super admin can delete a center.' }
  const id = optionalId(formData, 'id')
  if (!id) return { error: 'Missing center.' }

  try {
    await payload.delete({ collection: 'centers', id, user, overrideAccess: false })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not delete this center. Remove related records first.') }
  }

  refreshSite()
  redirect('/staff/centers')
}

export async function saveStaffUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  if (!isSuperAdmin(user)) return { error: 'Only a super admin can edit staff accounts.' }

  const existingId = optionalId(formData, 'id')
  const name = text(formData, 'name')
  const email = text(formData, 'email')
  const role = text(formData, 'role') === 'super-admin' ? 'super-admin' : 'staff'
  if (!name) return { error: 'Enter a name.' }
  if (!email.includes('@')) return { error: 'Enter a valid email.' }

  const center = role === 'staff' ? optionalId(formData, 'center') : null
  if (role === 'staff' && !center) return { error: 'Assign this staff member to a center.' }

  const passwordResult = passwords(formData, !existingId)
  if (passwordResult.error) return { error: passwordResult.error }

  const data: {
    name: string
    email: string
    role: 'super-admin' | 'staff'
    center: string | null
    password?: string
  } = { name, email, role, center }
  if (passwordResult.password) data.password = passwordResult.password

  let destination = existingId ? `/staff/team/${existingId}` : '/staff/team'
  try {
    if (existingId) {
      await payload.update({
        collection: 'users',
        id: existingId,
        data,
        user,
        overrideAccess: false,
      })
    } else {
      const created = await payload.create({
        collection: 'users',
        data,
        user,
        overrideAccess: false,
      })
      destination = `/staff/team/${created.id}`
    }
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not save this staff account.') }
  }

  refreshSite()
  redirect(destination)
}

export async function deleteStaffUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  if (!isSuperAdmin(user)) return { error: 'Only a super admin can delete staff accounts.' }
  const id = optionalId(formData, 'id')
  if (!id) return { error: 'Missing staff account.' }
  if (id === user.id) return { error: 'You cannot delete your own account.' }

  try {
    await payload.delete({ collection: 'users', id, user, overrideAccess: false })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not delete this staff account.') }
  }

  refreshSite()
  redirect('/staff/team')
}

export async function saveOwnAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  const name = text(formData, 'name')
  const email = text(formData, 'email')
  if (!name) return { error: 'Enter a name.' }
  if (!email.includes('@')) return { error: 'Enter a valid email.' }

  const passwordResult = passwords(formData, false)
  if (passwordResult.error) return { error: passwordResult.error }

  const data: { name: string; email: string; password?: string } = { name, email }
  if (passwordResult.password) data.password = passwordResult.password

  try {
    await payload.update({
      collection: 'users',
      id: user.id,
      data,
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not update your account.') }
  }

  refreshSite()
  redirect('/staff/account')
}

export async function uploadMedia(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  const alt = text(formData, 'alt')
  if (!alt) return { error: 'Alt text is required.' }
  const file = await readUpload(formData)
  if (!file) return { error: 'Choose a file.' }

  try {
    await payload.create({
      collection: 'media',
      data: { alt },
      file,
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not upload this file.') }
  }

  refreshSite()
  redirect('/staff/media')
}

export async function updateMedia(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  const id = optionalId(formData, 'id')
  const alt = text(formData, 'alt')
  if (!id) return { error: 'Missing file.' }
  if (!alt) return { error: 'Alt text is required.' }
  const file = await readUpload(formData)

  try {
    await payload.update({
      collection: 'media',
      id,
      data: { alt },
      ...(file ? { file } : {}),
      user,
      overrideAccess: false,
    })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not update this file.') }
  }

  refreshSite()
  return null
}

export async function deleteMedia(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, payload } = await requireStaff()
  const id = optionalId(formData, 'id')
  if (!id) return { error: 'Missing file.' }

  try {
    await payload.delete({ collection: 'media', id, user, overrideAccess: false })
  } catch (error) {
    return { error: getErrorMessage(error, 'Could not delete this file.') }
  }

  refreshSite()
  redirect('/staff/media')
}
