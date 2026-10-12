import type { Payload } from 'payload'

import type { AccessUser } from '@/access/roles'
import { formatDateTime, formatSeniorContact } from '@/lib/format'
import { getRelationID } from '@/lib/getRelationID'

export type Choice = { id: string; label: string }
export type ScopedChoice = Choice & { centerId: string }
export type HourTicketChoice = Choice & { studentId: string }
export type HourEventChoice = Choice & { studentIds: string[] }

type Ctx = { payload: Payload; user: AccessUser }

export async function centerChoices(ctx: Ctx): Promise<Choice[]> {
  const result = await ctx.payload.find({
    collection: 'centers',
    sort: 'name',
    limit: 200,
    depth: 0,
    user: ctx.user,
    overrideAccess: false,
  })
  return result.docs.map((center) => ({ id: String(center.id), label: center.name }))
}

export async function seniorChoices(ctx: Ctx): Promise<ScopedChoice[]> {
  const result = await ctx.payload.find({
    collection: 'seniors',
    sort: 'lastName',
    limit: 500,
    depth: 0,
    user: ctx.user,
    overrideAccess: false,
  })
  return result.docs.map((senior) => ({
    id: String(senior.id),
    label: `${senior.name} · ${formatSeniorContact(senior.contactMethod, senior.contact)}`,
    centerId: getRelationID(senior.center) || '',
  }))
}

export async function eventChoices(ctx: Ctx): Promise<ScopedChoice[]> {
  const result = await ctx.payload.find({
    collection: 'events',
    sort: 'startsAt',
    limit: 200,
    depth: 0,
    user: ctx.user,
    overrideAccess: false,
  })
  return result.docs.map((event) => ({
    id: String(event.id),
    label: `${event.title} · ${formatDateTime(event.startsAt)}`,
    centerId: getRelationID(event.center) || '',
  }))
}

export async function approvedStudentChoices(ctx: Ctx): Promise<ScopedChoice[]> {
  const result = await ctx.payload.find({
    collection: 'center-memberships',
    where: { status: { equals: 'approved' } },
    limit: 300,
    depth: 1,
    user: ctx.user,
    overrideAccess: false,
  })
  const choices: ScopedChoice[] = []
  for (const membership of result.docs) {
    const centerId = getRelationID(membership.center)
    if (!centerId || typeof membership.student !== 'object' || !membership.student) continue
    choices.push({
      id: String(membership.student.id),
      label: membership.student.name,
      centerId,
    })
  }
  return choices
}

export async function studentChoices(ctx: Ctx): Promise<Choice[]> {
  const result = await ctx.payload.find({
    collection: 'students',
    sort: 'name',
    limit: 300,
    depth: 0,
    user: ctx.user,
    overrideAccess: false,
  })
  return result.docs.map((student) => ({
    id: String(student.id),
    label: `${student.name} · ${student.email}`,
  }))
}

export async function hourLogChoices(ctx: Ctx): Promise<{
  students: Choice[]
  tickets: HourTicketChoice[]
  events: HourEventChoice[]
}> {
  const [students, tickets, rsvps] = await Promise.all([
    studentChoices(ctx),
    ctx.payload.find({
      collection: 'tickets',
      where: { assignedStudent: { exists: true } },
      limit: 300,
      depth: 0,
      user: ctx.user,
      overrideAccess: false,
    }),
    ctx.payload.find({
      collection: 'event-rsvps',
      where: { status: { equals: 'going' } },
      limit: 300,
      depth: 1,
      user: ctx.user,
      overrideAccess: false,
    }),
  ])

  const ticketChoices: HourTicketChoice[] = []
  for (const ticket of tickets.docs) {
    const studentId = getRelationID(ticket.assignedStudent)
    if (!studentId) continue
    ticketChoices.push({
      id: String(ticket.id),
      label: `${ticket.seniorName} — ${ticket.issue.slice(0, 80)}`,
      studentId,
    })
  }

  const events = new Map<string, HourEventChoice>()
  for (const rsvp of rsvps.docs) {
    const eventId = getRelationID(rsvp.event)
    const studentId = getRelationID(rsvp.student)
    if (!eventId || !studentId) continue
    const event = typeof rsvp.event === 'object' && rsvp.event ? rsvp.event : null
    const current = events.get(eventId) || {
      id: eventId,
      label: event?.title || 'Event',
      studentIds: [],
    }
    current.studentIds.push(studentId)
    events.set(eventId, current)
  }

  return { students, tickets: ticketChoices, events: [...events.values()] }
}
