import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

import { getStaffCenterID, hasApprovedMembership } from '@/access'
import { isStaff, isStudent, isSuperAdmin, type AccessUser } from '@/access/roles'
import { getRelationID } from '@/lib/getRelationID'
import { normalizeSeniorContact, seniorFullName } from '@/lib/seniors'

export const stampEventCenter: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  const user = req.user as AccessUser | null

  if (operation === 'create') {
    if (isStaff(user)) {
      data.center = getStaffCenterID(user)
      data.createdBy = user?.id
    } else if (isSuperAdmin(user)) {
      data.createdBy = data.createdBy || user?.id
    }
  }

  if (operation === 'update' && isStaff(user) && user) {
    data.center = getStaffCenterID(user)
  }

  return data
}

const ticketStatuses = ['open', 'assigned', 'completed', 'cancelled'] as const

function isTicketStatus(value: unknown): value is (typeof ticketStatuses)[number] {
  return typeof value === 'string' && ticketStatuses.some((status) => status === value)
}

function personName(user: AccessUser, fallback: string): string {
  if ('name' in user && typeof user.name === 'string' && user.name.trim()) return user.name.trim()
  return fallback
}

export const stampTicketDefaults: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const user = req.user as AccessUser | null

  if (isStudent(user)) {
    if (operation !== 'update' || !user) {
      throw new APIError('Students cannot create tickets.', 403)
    }

    if (getRelationID(originalDoc?.assignedStudent) === user.id) {
      if (!isTicketStatus(data.status)) {
        throw new APIError('Choose a valid status.', 400)
      }

      data.seniorName = originalDoc.seniorName
      data.seniorNotes = originalDoc.seniorNotes
      data.issue = originalDoc.issue
      data.device = originalDoc.device
      data.center = originalDoc.center
      data.event = originalDoc.event
      data.scheduledAt = originalDoc.scheduledAt
      data.createdBy = originalDoc.createdBy
      data.senior = originalDoc.senior ?? null
      data.assignedStudent = data.status === 'open' ? null : originalDoc.assignedStudent
      return data
    }

    if (originalDoc.status !== 'open' || originalDoc.assignedStudent) {
      throw new APIError('This ticket is no longer available to claim.', 400)
    }

    const centerID = getRelationID(originalDoc.center)
    if (!centerID || !user || !(await hasApprovedMembership(req, user.id, centerID))) {
      throw new APIError('You must be an approved volunteer at this center to claim tickets.', 403)
    }

    data.seniorName = originalDoc.seniorName
    data.seniorNotes = originalDoc.seniorNotes
    data.issue = originalDoc.issue
    data.device = originalDoc.device
    data.center = originalDoc.center
    data.event = originalDoc.event
    data.scheduledAt = originalDoc.scheduledAt
    data.createdBy = originalDoc.createdBy
    data.senior = originalDoc.senior ?? null
    data.assignedStudent = user.id
    data.status = 'assigned'
    return data
  }

  if (operation === 'create') {
    if (isStaff(user)) {
      data.center = getStaffCenterID(user)
      data.createdBy = user?.id
    } else if (isSuperAdmin(user)) {
      data.createdBy = data.createdBy || user?.id
    }

    if (data.assignedStudent) {
      data.status = 'assigned'
    } else if (!data.status) {
      data.status = 'open'
    }
  }

  if (operation === 'update' && isStaff(user)) {
    data.center = originalDoc.center
  }

  const centerID = getRelationID(data.center) || getRelationID(originalDoc?.center)
  const studentID = getRelationID(data.assignedStudent)

  if (studentID && centerID) {
    const approved = await hasApprovedMembership(req, studentID, centerID)
    if (!approved) {
      throw new APIError('That student must be an approved volunteer at this center.', 400)
    }
    if (operation === 'create' || originalDoc?.status === 'open') {
      if (!data.status || data.status === 'open') data.status = 'assigned'
    }
  }

  const eventID = getRelationID(data.event)
  if (eventID && centerID) {
    const event = await req.payload.findByID({
      collection: 'events',
      id: eventID,
      depth: 0,
      overrideAccess: true,
    })
    if (getRelationID(event.center) !== centerID) {
      throw new APIError('The event must belong to the same center as the ticket.', 400)
    }
  }

  const seniorID = getRelationID(data.senior)
  if (seniorID && centerID) {
    const senior = await req.payload.findByID({
      collection: 'seniors',
      id: seniorID,
      depth: 0,
      overrideAccess: true,
    })
    if (getRelationID(senior.center) !== centerID) {
      throw new APIError('Choose a senior from this center.', 400)
    }
    if (senior.name) data.seniorName = senior.name
  }

  return data
}

export const stampSeniorDefaults: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!data) return data
  const user = req.user as AccessUser | null
  const firstName = String(data.firstName ?? originalDoc?.firstName ?? '').trim()
  const lastName = String(data.lastName ?? originalDoc?.lastName ?? '').trim()
  if (operation === 'create' || data.firstName !== undefined) data.firstName = firstName
  if (operation === 'create' || data.lastName !== undefined) data.lastName = lastName
  data.name = seniorFullName(
    String(data.firstName ?? originalDoc?.firstName ?? ''),
    String(data.lastName ?? originalDoc?.lastName ?? ''),
  )

  const method = String(data.contactMethod ?? originalDoc?.contactMethod ?? 'center')
  const contact = String(data.contact ?? originalDoc?.contact ?? '')
  const parsed = normalizeSeniorContact(method, contact)
  if ('error' in parsed) throw new APIError(parsed.error, 400)
  data.contactMethod = parsed.contactMethod
  data.contact = parsed.contact

  if (isStaff(user)) {
    const centerID = getStaffCenterID(user)
    if (!centerID) throw new APIError('Your account is not assigned to a center.', 400)
    if (operation === 'create') data.center = centerID
    if (operation === 'update' && originalDoc) data.center = originalDoc.center
  } else if (!getRelationID(data.center) && !getRelationID(originalDoc?.center)) {
    throw new APIError('Choose a center.', 400)
  }

  return data
}

export const syncLinkedTicketNames: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (!previousDoc || !doc?.name || previousDoc.name === doc.name) return doc

  const tickets = await req.payload.find({
    collection: 'tickets',
    where: { senior: { equals: doc.id } },
    limit: 200,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  })

  for (const ticket of tickets.docs) {
    if (ticket.seniorName === doc.name) continue
    await req.payload.update({
      collection: 'tickets',
      id: ticket.id,
      data: { seniorName: doc.name },
      depth: 0,
      overrideAccess: true,
      req,
    })
  }

  return doc
}

export const stampTicketNote: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create') {
    throw new APIError('Notes cannot be changed.', 400)
  }

  const user = req.user as AccessUser | null
  const ticketID = getRelationID(data.ticket)
  const body = typeof data.body === 'string' ? data.body.trim() : ''
  if (!ticketID) throw new APIError('A ticket is required.', 400)
  if (!body) throw new APIError('Write a note.', 400)

  const ticket = await req.payload.findByID({
    collection: 'tickets',
    id: ticketID,
    depth: 0,
    overrideAccess: true,
  })

  if (isStudent(user) && user) {
    if (getRelationID(ticket.assignedStudent) !== user.id) {
      throw new APIError('You can only add notes to tickets assigned to you.', 403)
    }
    data.authorName = personName(user, 'Student')
    data.authorRole = 'student'
  } else if (isSuperAdmin(user) && user) {
    data.authorName = personName(user, 'Staff')
    data.authorRole = 'staff'
  } else if (isStaff(user) && user) {
    const centerID = getStaffCenterID(user)
    if (!centerID || getRelationID(ticket.center) !== centerID) {
      throw new APIError('You can only add notes to tickets at your center.', 403)
    }
    data.authorName = personName(user, 'Staff')
    data.authorRole = 'staff'
  } else {
    throw new APIError('You cannot add notes to this ticket.', 403)
  }

  data.ticket = ticketID
  data.body = body
  if (data.status && !isTicketStatus(data.status)) {
    throw new APIError('Choose a valid status.', 400)
  }

  return data
}

export const stampMembershipDefaults: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const user = req.user as AccessUser | null

  if (isStudent(user) && operation === 'create' && user) {
    data.student = user.id
    data.status = 'pending'

    const existing = await req.payload.find({
      collection: 'center-memberships',
      where: {
        and: [{ student: { equals: user.id } }, { center: { equals: getRelationID(data.center) } }],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existing.totalDocs > 0) {
      throw new APIError('You have already requested to join this center.', 400)
    }
  }

  if (operation === 'update' && isStaff(user) && originalDoc) {
    data.student = originalDoc.student
    data.center = originalDoc.center
  }

  return data
}

export const stampEventRsvpDefaults: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const user = req.user as AccessUser | null
  const eventID = getRelationID(data.event) || getRelationID(originalDoc?.event)

  if (!eventID) {
    throw new APIError('An event is required.', 400)
  }

  const event = await req.payload.findByID({
    collection: 'events',
    id: eventID,
    depth: 0,
    overrideAccess: true,
  })
  const centerID = getRelationID(event.center)

  if (isStudent(user) && user) {
    if (operation === 'create') {
      data.student = user.id
      data.status = data.status || 'going'
    } else {
      data.student = user.id
      data.event = originalDoc.event
    }

    if (!centerID || !(await hasApprovedMembership(req, user.id, centerID))) {
      throw new APIError('You must be an approved volunteer at this center to RSVP.', 403)
    }
  }

  const studentID = getRelationID(data.student) || getRelationID(originalDoc?.student)
  const nextStatus = data.status || originalDoc?.status || 'going'

  if (operation === 'create' && studentID) {
    const existing = await req.payload.find({
      collection: 'event-rsvps',
      where: {
        and: [{ event: { equals: eventID } }, { student: { equals: studentID } }],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.totalDocs > 0) {
      throw new APIError('You have already RSVPed to this event.', 400)
    }
  }

  const becomingGoing =
    nextStatus === 'going' && (operation === 'create' || originalDoc?.status !== 'going')

  if (becomingGoing && typeof event.maxStudents === 'number') {
    const going = await req.payload.count({
      collection: 'event-rsvps',
      where: {
        and: [{ event: { equals: eventID } }, { status: { equals: 'going' } }],
      },
      overrideAccess: true,
    })
    if (going.totalDocs >= event.maxStudents) {
      throw new APIError('This event is full.', 400)
    }
  }

  return data
}

export const stampHourLogDefaults: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  const user = req.user as AccessUser | null

  if (isStudent(user) && user) {
    data.student = user.id
  }

  const studentID = getRelationID(data.student) || getRelationID(originalDoc?.student)
  if (!studentID) {
    throw new APIError('A student is required to log hours.', 400)
  }

  const hours = Number(data.hours ?? originalDoc?.hours)
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new APIError('Hours must be greater than 0.', 400)
  }

  const ticketID = getRelationID(data.ticket)
  if (ticketID) {
    const ticket = await req.payload.findByID({
      collection: 'tickets',
      id: ticketID,
      depth: 0,
      overrideAccess: true,
    })
    if (getRelationID(ticket.assignedStudent) !== studentID) {
      throw new APIError('You can only log hours against tickets assigned to you.', 400)
    }
  }

  const eventID = getRelationID(data.event)
  if (eventID) {
    const rsvp = await req.payload.find({
      collection: 'event-rsvps',
      where: {
        and: [
          { event: { equals: eventID } },
          { student: { equals: studentID } },
          { status: { equals: 'going' } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (rsvp.totalDocs === 0) {
      throw new APIError('You can only log hours against events you RSVPed to.', 400)
    }
  }

  return data
}
