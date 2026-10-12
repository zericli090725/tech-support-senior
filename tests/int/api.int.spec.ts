import { getPayload, Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { getRelationID } from '@/lib/getRelationID'
import config from '@/payload.config'
import type { Center, Student, Ticket, User } from '@/payload-types'

let payload: Payload
const created = {
  userIds: [] as string[],
  studentIds: [] as string[],
  centerIds: [] as string[],
  ticketIds: [] as string[],
  eventIds: [] as string[],
  membershipIds: [] as string[],
  rsvpIds: [] as string[],
  hourLogIds: [] as string[],
  noteIds: [] as string[],
  seniorIds: [] as string[],
}

const suffix = `${Date.now()}`
const password = 'test-password'

function asStaff(user: User) {
  return { ...user, collection: 'users' as const }
}

function asStudent(student: Student) {
  return { ...student, collection: 'students' as const }
}

describe('program access', () => {
  let centerA: Center
  let centerB: Center
  let staffA: User
  let staffB: User
  let approvedStudent: Student
  let pendingStudent: Student
  let ticketA: Ticket
  let ticketB: Ticket
  let eventA: { id: string }

  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    centerA = await payload.create({
      collection: 'centers',
      data: { name: `Int Center A ${suffix}`, address: '1 Test St' },
    })
    centerB = await payload.create({
      collection: 'centers',
      data: { name: `Int Center B ${suffix}`, address: '2 Test St' },
    })
    created.centerIds.push(String(centerA.id), String(centerB.id))

    staffA = await payload.create({
      collection: 'users',
      data: {
        name: 'Staff A',
        email: `staff-a-${suffix}@example.com`,
        password,
        role: 'staff',
        center: centerA.id,
      },
    })
    staffB = await payload.create({
      collection: 'users',
      data: {
        name: 'Staff B',
        email: `staff-b-${suffix}@example.com`,
        password,
        role: 'staff',
        center: centerB.id,
      },
    })
    created.userIds.push(String(staffA.id), String(staffB.id))

    approvedStudent = await payload.create({
      collection: 'students',
      data: {
        name: 'Approved Student',
        email: `approved-${suffix}@student.edu`,
        password,
      },
    })
    pendingStudent = await payload.create({
      collection: 'students',
      data: {
        name: 'Pending Student',
        email: `pending-${suffix}@student.edu`,
        password,
      },
    })
    created.studentIds.push(String(approvedStudent.id), String(pendingStudent.id))

    const approvedMembership = await payload.create({
      collection: 'center-memberships',
      data: {
        student: approvedStudent.id,
        center: centerA.id,
        status: 'approved',
      },
    })
    const pendingMembership = await payload.create({
      collection: 'center-memberships',
      data: {
        student: pendingStudent.id,
        center: centerA.id,
        status: 'pending',
      },
    })
    created.membershipIds.push(String(approvedMembership.id), String(pendingMembership.id))

    const startsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    const event = await payload.create({
      collection: 'events',
      data: {
        title: `Int Event ${suffix}`,
        center: centerA.id,
        startsAt,
        locationInCenter: 'Room 1',
        maxStudents: 5,
        createdBy: staffA.id,
      },
    })
    eventA = { id: String(event.id) }
    created.eventIds.push(eventA.id)

    ticketA = await payload.create({
      collection: 'tickets',
      data: {
        seniorName: 'Senior A',
        issue: 'Needs help with email',
        device: 'computer',
        center: centerA.id,
        status: 'open',
        createdBy: staffA.id,
      },
    })
    ticketB = await payload.create({
      collection: 'tickets',
      data: {
        seniorName: 'Senior B',
        issue: 'Phone keeps ringing',
        device: 'phone',
        center: centerB.id,
        status: 'open',
        createdBy: staffB.id,
      },
    })
    created.ticketIds.push(String(ticketA.id), String(ticketB.id))
  }, 60000)

  afterAll(async () => {
    const wipe = async (
      collection:
        | 'hour-logs'
        | 'event-rsvps'
        | 'ticket-notes'
        | 'tickets'
        | 'events'
        | 'center-memberships'
        | 'seniors'
        | 'centers'
        | 'students'
        | 'users',
      ids: string[],
    ) => {
      for (const id of ids) {
        await payload.delete({ collection, id }).catch(() => undefined)
      }
    }

    await wipe('hour-logs', created.hourLogIds)
    await wipe('event-rsvps', created.rsvpIds)
    await wipe('ticket-notes', created.noteIds)
    await wipe('tickets', created.ticketIds)
    await wipe('events', created.eventIds)
    await wipe('center-memberships', created.membershipIds)
    await wipe('seniors', created.seniorIds)
    await wipe('centers', created.centerIds)
    await wipe('students', created.studentIds)
    await wipe('users', created.userIds)
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })

  it('prevents staff from reading another center’s tickets', async () => {
    const result = await payload.find({
      collection: 'tickets',
      user: asStaff(staffA),
      overrideAccess: false,
      limit: 100,
    })

    const ids = result.docs.map((doc) => String(doc.id))
    expect(ids).toContain(String(ticketA.id))
    expect(ids).not.toContain(String(ticketB.id))
    expect(result.docs.every((doc) => getRelationID(doc.center) === String(centerA.id))).toBe(true)
  })

  it('blocks an unapproved student from claiming a ticket', async () => {
    await expect(
      payload.update({
        collection: 'tickets',
        id: ticketA.id,
        data: {
          assignedStudent: pendingStudent.id,
          status: 'assigned',
        },
        user: asStudent(pendingStudent),
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('lets an approved student claim a ticket and log hours against it', async () => {
    const claimed = await payload.update({
      collection: 'tickets',
      id: ticketA.id,
      data: {
        assignedStudent: approvedStudent.id,
        status: 'assigned',
      },
      user: asStudent(approvedStudent),
      overrideAccess: false,
    })

    expect(claimed.status).toBe('assigned')
    expect(getRelationID(claimed.assignedStudent)).toBe(String(approvedStudent.id))

    const hourLog = await payload.create({
      collection: 'hour-logs',
      data: {
        student: approvedStudent.id,
        hours: 2,
        date: new Date().toISOString(),
        notes: 'Walked through email setup',
        ticket: claimed.id,
      },
      user: asStudent(approvedStudent),
      overrideAccess: false,
    })

    expect(hourLog.hours).toBe(2)
    created.hourLogIds.push(String(hourLog.id))

    const completed = await payload.update({
      collection: 'tickets',
      id: ticketA.id,
      data: { status: 'completed' },
      user: asStudent(approvedStudent),
      overrideAccess: false,
    })
    expect(completed.status).toBe('completed')
    expect(getRelationID(completed.assignedStudent)).toBe(String(approvedStudent.id))

    const note = await payload.create({
      collection: 'ticket-notes',
      data: {
        ticket: ticketA.id,
        body: 'Finished the email setup.',
        status: 'completed',
        authorName: 'Ignored',
        authorRole: 'staff',
      },
      user: asStudent(approvedStudent),
      overrideAccess: false,
    })
    expect(note.body).toBe('Finished the email setup.')
    expect(note.authorName).toBe('Approved Student')
    expect(note.authorRole).toBe('student')
    expect(note.status).toBe('completed')
    created.noteIds.push(String(note.id))

    await expect(
      payload.create({
        collection: 'ticket-notes',
        data: {
          ticket: ticketA.id,
          body: 'I should not be able to write this.',
          authorName: 'Pending Student',
          authorRole: 'student',
        },
        user: asStudent(pendingStudent),
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await expect(
      payload.create({
        collection: 'ticket-notes',
        data: {
          ticket: ticketA.id,
          body: 'Wrong center.',
          authorName: 'Staff B',
          authorRole: 'staff',
        },
        user: asStaff(staffB),
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const staffNote = await payload.create({
      collection: 'ticket-notes',
      data: {
        ticket: ticketA.id,
        body: 'Please confirm the password change stuck.',
        status: 'assigned',
        authorName: 'Ignored',
        authorRole: 'student',
      },
      user: asStaff(staffA),
      overrideAccess: false,
    })
    expect(staffNote.authorName).toBe('Staff A')
    expect(staffNote.authorRole).toBe('staff')
    created.noteIds.push(String(staffNote.id))

    const reopened = await payload.update({
      collection: 'tickets',
      id: ticketA.id,
      data: { status: 'open' },
      user: asStudent(approvedStudent),
      overrideAccess: false,
    })
    expect(reopened.status).toBe('open')
    expect(getRelationID(reopened.assignedStudent)).toBeUndefined()
  })

  it('blocks an unapproved student from RSVPing and allows an approved student', async () => {
    await expect(
      payload.create({
        collection: 'event-rsvps',
        data: {
          event: eventA.id,
          student: pendingStudent.id,
          status: 'going',
        },
        user: asStudent(pendingStudent),
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const rsvp = await payload.create({
      collection: 'event-rsvps',
      data: {
        event: eventA.id,
        student: approvedStudent.id,
        status: 'going',
      },
      user: asStudent(approvedStudent),
      overrideAccess: false,
    })

    expect(rsvp.status).toBe('going')
    created.rsvpIds.push(String(rsvp.id))
  })

  it('keeps senior profiles at one center and links their tickets', async () => {
    const senior = await payload.create({
      collection: 'seniors',
      data: {
        firstName: 'Helen',
        lastName: 'Nakamura',
        name: 'Helen Nakamura',
        contactMethod: 'email',
        contact: 'Helen.Nakamura@example.com',
        center: centerA.id,
      },
      user: asStaff(staffA),
      overrideAccess: false,
    })
    created.seniorIds.push(String(senior.id))

    expect(senior.name).toBe('Helen Nakamura')
    expect(senior.contact).toBe('helen.nakamura@example.com')

    const viaCenter = await payload.create({
      collection: 'seniors',
      data: {
        firstName: 'Pat',
        lastName: 'Lee',
        name: 'Pat Lee',
        contactMethod: 'center',
        contact: '555-0100',
        center: centerA.id,
      },
      user: asStaff(staffA),
      overrideAccess: false,
    })
    created.seniorIds.push(String(viaCenter.id))
    expect(viaCenter.contact || null).toBeNull()

    await expect(
      payload.create({
        collection: 'seniors',
        data: {
          firstName: 'Bad',
          lastName: 'Email',
          name: 'Bad Email',
          contactMethod: 'email',
          contact: 'not-an-email',
          center: centerA.id,
        },
        user: asStaff(staffA),
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const hidden = await payload.find({
      collection: 'seniors',
      user: asStaff(staffB),
      overrideAccess: false,
      limit: 100,
    })
    expect(hidden.docs.map((doc) => String(doc.id))).not.toContain(String(senior.id))

    await expect(
      payload.find({
        collection: 'seniors',
        user: asStudent(approvedStudent),
        overrideAccess: false,
        limit: 10,
      }),
    ).rejects.toThrow()

    await expect(
      payload.create({
        collection: 'tickets',
        data: {
          seniorName: 'Wrong center',
          issue: 'Should fail',
          center: centerB.id,
          senior: senior.id,
          status: 'open',
        },
        user: asStaff(staffB),
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const linked = await payload.create({
      collection: 'tickets',
      data: {
        seniorName: 'Placeholder',
        issue: 'Follow-up visit for email',
        center: centerA.id,
        senior: senior.id,
        status: 'open',
        createdBy: staffA.id,
      },
      user: asStaff(staffA),
      overrideAccess: false,
    })
    created.ticketIds.push(String(linked.id))
    expect(linked.seniorName).toBe('Helen Nakamura')
    expect(getRelationID(linked.senior)).toBe(String(senior.id))

    const renamed = await payload.update({
      collection: 'seniors',
      id: senior.id,
      data: { firstName: 'Helena', lastName: 'Nakamura' },
      user: asStaff(staffA),
      overrideAccess: false,
    })
    expect(renamed.name).toBe('Helena Nakamura')

    const history = await payload.findByID({
      collection: 'tickets',
      id: linked.id,
      depth: 0,
      overrideAccess: true,
    })
    expect(history.seniorName).toBe('Helena Nakamura')
  })

  it('lets a student with no memberships list tickets without a 403', async () => {
    const unaffiliated = await payload.create({
      collection: 'students',
      data: {
        name: 'Unaffiliated Student',
        email: `unaffiliated-${suffix}@student.edu`,
        password,
      },
    })
    created.studentIds.push(String(unaffiliated.id))

    const result = await payload.find({
      collection: 'tickets',
      user: asStudent(unaffiliated),
      overrideAccess: false,
      limit: 10,
    })

    expect(result.docs).toEqual([])
  })
})
