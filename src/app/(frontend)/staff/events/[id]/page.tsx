import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getStaffCenterID } from '@/access/getStaffCenterID'
import { isSuperAdmin } from '@/access/roles'
import { ActionButton } from '@/app/(frontend)/components/ActionButton'
import { StatusBadge } from '@/app/(frontend)/components/StatusBadge'
import { createRsvp, deleteEvent, deleteRsvp, setRsvpStatus } from '@/app/(frontend)/actions/staff'
import { ConfirmButton } from '@/app/(frontend)/staff/components/ConfirmButton'
import { EventForm } from '@/app/(frontend)/staff/components/EventForm'
import { SelectField } from '@/app/(frontend)/staff/components/fields'
import { StaffForm } from '@/app/(frontend)/staff/components/StaffForm'
import { approvedStudentChoices, centerChoices } from '@/app/(frontend)/staff/options'
import { requireStaff } from '@/lib/auth'
import { deviceLabels, formatDateTime, getDocName } from '@/lib/format'
import { getRelationID } from '@/lib/getRelationID'
import type { Ticket } from '@/payload-types'

type Props = {
  params: Promise<{ id: string }>
}

export default async function StaffEventPage({ params }: Props) {
  const { id } = await params
  const auth = await requireStaff()
  const { user, payload } = auth
  const superAdmin = isSuperAdmin(user)

  let event
  try {
    event = await payload.findByID({
      collection: 'events',
      id,
      depth: 1,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  const centerId = getRelationID(event.center) || ''
  const [centers, students, tickets, rsvps, going] = await Promise.all([
    centerChoices(auth),
    approvedStudentChoices(auth),
    payload.find({
      collection: 'tickets',
      where: { event: { equals: id } },
      depth: 0,
      limit: 100,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'event-rsvps',
      where: { event: { equals: id } },
      sort: '-createdAt',
      depth: 1,
      limit: 200,
      user,
      overrideAccess: false,
    }),
    payload.count({
      collection: 'event-rsvps',
      where: { and: [{ event: { equals: id } }, { status: { equals: 'going' } }] },
      user,
      overrideAccess: false,
    }),
  ])

  const taken = new Set(rsvps.docs.map((rsvp) => getRelationID(rsvp.student)).filter(Boolean))
  const availableStudents = students.filter(
    (student) => student.centerId === centerId && !taken.has(student.id),
  )
  const lockCenterId = getStaffCenterID(user)

  return (
    <section className="flex flex-col gap-6">
      <p>
        <Link href="/staff/events">← Events</Link>
      </p>
      <div>
        <h1>{event.title}</h1>
        <p className="text-muted-foreground">
          {getDocName(event.center)}
          {event.locationInCenter ? ` · ${event.locationInCenter}` : ''} · {formatDateTime(event.startsAt)}
          {typeof event.maxStudents === 'number'
            ? ` · ${going.totalDocs} of ${event.maxStudents} students going`
            : ` · ${going.totalDocs} going`}
        </p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <article className="flex flex-col gap-4 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
          <h2>Edit event</h2>
          <EventForm
            centers={centers}
            lockCenterId={lockCenterId}
            centerLabel={centers.find((center) => center.id === (lockCenterId || centerId))?.label}
            defaults={{
              id: String(event.id),
              title: event.title,
              centerId,
              startsAt: event.startsAt,
              endsAt: event.endsAt,
              locationInCenter: event.locationInCenter,
              maxStudents: event.maxStudents,
              description: event.description,
            }}
            submitLabel="Save event"
          />
          <ConfirmButton
            action={deleteEvent}
            hiddenFields={{ id: String(event.id) }}
            label="Delete event"
            confirmMessage={`Delete ${event.title}? Tickets linked to it stay, but lose this event.`}
          />
        </article>
        <div className="flex flex-col gap-6">
          <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
            <h2>RSVPs</h2>
            {rsvps.docs.length === 0 ? (
              <p className="text-muted-foreground">No students have RSVPed yet.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {rsvps.docs.map((rsvp) => {
                  const student = typeof rsvp.student === 'object' ? rsvp.student : null
                  const studentId = getRelationID(rsvp.student)
                  return (
                    <li key={rsvp.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          {studentId ? (
                            <Link href={`/staff/students/${studentId}`}>{student?.name || 'Student'}</Link>
                          ) : (
                            'Student'
                          )}
                          {student?.email ? <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{student.email}</div> : null}
                        </div>
                        <StatusBadge status={rsvp.status} />
                      </div>
                      {superAdmin ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {rsvp.status !== 'going' ? (
                            <ActionButton
                              action={setRsvpStatus}
                              hiddenFields={{ id: String(rsvp.id), status: 'going' }}
                              label="Mark going"
                              pendingLabel="Saving…"
                            />
                          ) : null}
                          {rsvp.status !== 'cancelled' ? (
                            <ActionButton
                              action={setRsvpStatus}
                              hiddenFields={{ id: String(rsvp.id), status: 'cancelled' }}
                              label="Cancel RSVP"
                              pendingLabel="Saving…"
                              variant="outline"
                            />
                          ) : null}
                          <ConfirmButton
                            action={deleteRsvp}
                            hiddenFields={{ id: String(rsvp.id) }}
                            label="Delete"
                            confirmMessage="Delete this RSVP?"
                          />
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
            {superAdmin && availableStudents.length > 0 ? (
              <StaffForm action={createRsvp} submitLabel="Add RSVP">
                <input type="hidden" name="event" value={String(event.id)} />
                <SelectField label="Approved student" name="student" required defaultValue="">
                  <option value="">Choose a student</option>
                  {availableStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.label}
                    </option>
                  ))}
                </SelectField>
              </StaffForm>
            ) : null}
            {!superAdmin ? (
              <p className="text-muted-foreground">Students manage their own RSVPs. You can see who is coming.</p>
            ) : null}
          </article>
          <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
            <div className="flex items-start justify-between gap-3">
              <h2>Seniors at this event</h2>
              <Link href={`/staff/tickets/new?event=${event.id}`}>Add a ticket</Link>
            </div>
            {tickets.docs.length === 0 ? (
              <p className="text-muted-foreground">No tickets linked yet.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {tickets.docs.map((ticket: Ticket) => (
                  <li key={ticket.id}>
                    <Link href={`/staff/tickets/${ticket.id}`}>{ticket.seniorName}</Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <StatusBadge status={ticket.status} />
                      {ticket.device ? ` ${deviceLabels[ticket.device] || ticket.device}` : ''} · {ticket.issue}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </div>
    </section>
  )
}
