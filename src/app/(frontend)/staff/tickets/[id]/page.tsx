import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getStaffCenterID } from '@/access/getStaffCenterID'
import { deleteTicket } from '@/app/(frontend)/actions/staff'
import { TicketNotes } from '@/app/(frontend)/components/TicketNotes'
import { ConfirmButton } from '@/app/(frontend)/staff/components/ConfirmButton'
import { TicketForm } from '@/app/(frontend)/staff/components/TicketForm'
import { approvedStudentChoices, centerChoices, eventChoices, seniorChoices } from '@/app/(frontend)/staff/options'
import { requireStaff } from '@/lib/auth'
import { formatDateTime, getDocName } from '@/lib/format'
import { getRelationID } from '@/lib/getRelationID'

type Props = {
  params: Promise<{ id: string }>
}

export default async function StaffTicketPage({ params }: Props) {
  const { id } = await params
  const auth = await requireStaff()
  const { user, payload } = auth

  let ticket
  try {
    ticket = await payload.findByID({
      collection: 'tickets',
      id,
      depth: 1,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  const [centers, seniors, events, students] = await Promise.all([
    centerChoices(auth),
    seniorChoices(auth),
    eventChoices(auth),
    approvedStudentChoices(auth),
  ])
  const lockCenterId = getStaffCenterID(user)
  const centerId = getRelationID(ticket.center) || ''
  const seniorId = getRelationID(ticket.senior) || ''
  const notes = await payload.find({
    collection: 'ticket-notes',
    where: { ticket: { equals: ticket.id } },
    sort: 'createdAt',
    depth: 0,
    limit: 100,
    user,
    overrideAccess: false,
  })

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p>
        <Link href="/staff/tickets">← Tickets</Link>
      </p>
      <div>
        <h1>{ticket.seniorName}</h1>
        <p className="text-muted-foreground">
          Created {formatDateTime(ticket.createdAt)}
          {ticket.createdBy ? ` · ${getDocName(ticket.createdBy)}` : ''}
        </p>
        {seniorId ? (
          <p>
            <Link href={`/staff/seniors/${seniorId}`}>Senior profile</Link>
          </p>
        ) : null}
      </div>
      <TicketForm
        key={`${ticket.status}-${seniorId}`}
        centers={centers}
        seniors={seniors}
        events={events}
        students={students}
        lockCenterId={lockCenterId}
        centerLabel={centers.find((center) => center.id === (lockCenterId || centerId))?.label || getDocName(ticket.center)}
        defaults={{
          id: String(ticket.id),
          seniorId,
          seniorName: ticket.seniorName,
          seniorNotes: ticket.seniorNotes,
          issue: ticket.issue,
          device: ticket.device,
          centerId,
          eventId: getRelationID(ticket.event) || '',
          scheduledAt: ticket.scheduledAt,
          assignedStudentId: getRelationID(ticket.assignedStudent) || '',
          status: ticket.status,
        }}
        submitLabel="Save ticket"
      />
      <TicketNotes notes={notes.docs} ticketId={String(ticket.id)} status={ticket.status} canAdd />
      <ConfirmButton
        action={deleteTicket}
        hiddenFields={{ id: String(ticket.id) }}
        label="Delete ticket"
        confirmMessage={`Delete the ticket for ${ticket.seniorName}?`}
      />
    </section>
  )
}
