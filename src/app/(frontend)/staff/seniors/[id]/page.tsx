import Link from 'next/link'
import { notFound } from 'next/navigation'

import { deleteSenior } from '@/app/(frontend)/actions/staff'
import { StatusBadge } from '@/app/(frontend)/components/StatusBadge'
import { ConfirmButton } from '@/app/(frontend)/staff/components/ConfirmButton'
import { SeniorForm } from '@/app/(frontend)/staff/components/SeniorForm'
import { Button } from '@/components/ui/button'
import { requireStaff } from '@/lib/auth'
import { deviceLabels, formatDateTime, formatSeniorContact, getDocName } from '@/lib/format'
import { getRelationID } from '@/lib/getRelationID'
import type { Ticket } from '@/payload-types'

type Props = {
  params: Promise<{ id: string }>
}

export default async function StaffSeniorPage({ params }: Props) {
  const { id } = await params
  const { user, payload } = await requireStaff()

  let senior
  try {
    senior = await payload.findByID({
      collection: 'seniors',
      id,
      depth: 1,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  const tickets = await payload.find({
    collection: 'tickets',
    where: { senior: { equals: id } },
    sort: '-createdAt',
    depth: 0,
    limit: 50,
    user,
    overrideAccess: false,
  })
  const centerId = getRelationID(senior.center) || ''

  return (
    <section className="flex flex-col gap-6">
      <p>
        <Link href="/staff/seniors">← Seniors</Link>
      </p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>{senior.name}</h1>
          <p className="text-muted-foreground">
            {formatSeniorContact(senior.contactMethod, senior.contact)}
            {centerId ? (
              <>
                {' · '}
                <Link href={`/staff/centers/${centerId}`}>{getDocName(senior.center)}</Link>
              </>
            ) : null}
          </p>
        </div>
        <Button asChild>
          <Link href={`/staff/tickets/new?senior=${senior.id}`}>New ticket</Link>
        </Button>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
          <h2>Profile</h2>
          <SeniorForm
            centers={[]}
            lockCenterId={centerId}
            centerLabel={getDocName(senior.center)}
            defaults={{
              id: String(senior.id),
              firstName: senior.firstName,
              lastName: senior.lastName,
              contactMethod: senior.contactMethod,
              contact: senior.contact,
              centerId,
            }}
            submitLabel="Save senior"
          />
          {tickets.totalDocs === 0 ? (
            <ConfirmButton
              action={deleteSenior}
              hiddenFields={{ id: String(senior.id) }}
              label="Delete senior"
              confirmMessage={`Delete ${senior.name}'s profile?`}
            />
          ) : (
            <p className="text-muted-foreground">Tickets keep this profile so the history stays in one place.</p>
          )}
        </article>
        <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
          <h2>Ticket history</h2>
          {tickets.docs.length === 0 ? (
            <p className="text-muted-foreground">No tickets yet.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {tickets.docs.map((ticket: Ticket) => (
                <li key={ticket.id}>
                  <Link href={`/staff/tickets/${ticket.id}`}>{ticket.issue}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <StatusBadge status={ticket.status} />
                    {ticket.device ? deviceLabels[ticket.device] || ticket.device : 'Device not listed'}
                    {ticket.scheduledAt ? ` · ${formatDateTime(ticket.scheduledAt)}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {tickets.totalDocs > tickets.docs.length ? (
            <p className="text-muted-foreground">Showing the latest {tickets.docs.length} tickets.</p>
          ) : null}
        </article>
      </div>
    </section>
  )
}
