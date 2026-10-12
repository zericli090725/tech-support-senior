import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { ActionButton } from '@/app/(frontend)/components/ActionButton'
import { StudentStatus } from '@/app/(frontend)/components/StudentStatus'
import { TicketNotes } from '@/app/(frontend)/components/TicketNotes'
import { claimTicket } from '@/app/(frontend)/actions/tickets'
import { Button } from '@/components/ui/button'
import { requireStudent } from '@/lib/auth'
import { deviceLabels, formatDateTime, getDocName } from '@/lib/format'
import { getRelationID } from '@/lib/getRelationID'
import type { Event } from '@/payload-types'

type Props = {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params
  const { user, payload } = await requireStudent()

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

  const assignedToSelf = getRelationID(ticket.assignedStudent) === user.id
  const event = typeof ticket.event === 'object' ? (ticket.event as Event) : null
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
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/tickets">
          <ArrowLeft />
          Open tickets
        </Link>
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-4xl leading-tight sm:text-5xl">{ticket.seniorName}</h1>
        <StudentStatus status={ticket.status} />
      </div>
      <p className="text-lg leading-relaxed text-muted-foreground">{ticket.issue}</p>
      <dl className="grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Center</dt>
          <dd className="mt-1">{getDocName(ticket.center)}</dd>
        </div>
        {ticket.device ? (
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Device</dt>
            <dd className="mt-1">{deviceLabels[ticket.device] || ticket.device}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">When</dt>
          <dd className="mt-1">{formatDateTime(ticket.scheduledAt)}</dd>
        </div>
        {event ? (
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Event</dt>
            <dd className="mt-1">
              <Link href={`/events/${event.id}`} className="underline underline-offset-4">
                {event.title}
              </Link>
              {event.locationInCenter ? ` · ${event.locationInCenter}` : ''}
            </dd>
          </div>
        ) : null}
        {ticket.seniorNotes ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Notes</dt>
            <dd className="mt-1 leading-relaxed">{ticket.seniorNotes}</dd>
          </div>
        ) : null}
      </dl>
      {ticket.status === 'open' && !ticket.assignedStudent ? (
        <ActionButton
          action={claimTicket}
          hiddenFields={{ ticketId: String(ticket.id) }}
          label="Claim this ticket"
          pendingLabel="Claiming…"
          variant="default"
          className="h-10"
        />
      ) : null}
      {assignedToSelf ? (
        <p className="text-muted-foreground">
          This ticket is assigned to you.{' '}
          <Link href="/profile" className="text-foreground underline underline-offset-4">
            Log hours
          </Link>{' '}
          when you are done.
        </p>
      ) : null}
      {assignedToSelf || notes.docs.length > 0 ? (
        <TicketNotes
          notes={notes.docs}
          ticketId={String(ticket.id)}
          status={ticket.status}
          canAdd={assignedToSelf}
          releaseOnOpen
        />
      ) : null}
    </div>
  )
}
