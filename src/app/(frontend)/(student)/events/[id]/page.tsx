import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { ActionButton } from '@/app/(frontend)/components/ActionButton'
import { StudentStatus } from '@/app/(frontend)/components/StudentStatus'
import { cancelRsvp, rsvpToEvent } from '@/app/(frontend)/actions/events'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { requireStudent } from '@/lib/auth'
import { deviceLabels, formatDateTime, getDocName } from '@/lib/format'
import type { Ticket } from '@/payload-types'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const { user, payload } = await requireStudent()

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

  const [tickets, rsvps] = await Promise.all([
    payload.find({
      collection: 'tickets',
      where: { event: { equals: id } },
      depth: 0,
      limit: 50,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'event-rsvps',
      where: {
        and: [{ event: { equals: id } }, { student: { equals: user.id } }],
      },
      limit: 1,
      depth: 0,
      user,
      overrideAccess: false,
    }),
  ])

  const myRsvp = rsvps.docs[0]
  const going = myRsvp?.status === 'going'

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/events">
          <ArrowLeft />
          Events
        </Link>
      </Button>
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl leading-tight sm:text-5xl">{event.title}</h1>
        <p className="text-muted-foreground">
          {getDocName(event.center)}
          {event.locationInCenter ? ` · ${event.locationInCenter}` : ''}
        </p>
        <p>{formatDateTime(event.startsAt)}</p>
      </div>
      {event.description ? (
        <p className="text-lg leading-relaxed text-muted-foreground">{event.description}</p>
      ) : null}

      {going && myRsvp ? (
        <div className="flex flex-wrap items-center gap-3">
          <StudentStatus status="going" />
          <ActionButton
            action={cancelRsvp}
            hiddenFields={{ rsvpId: String(myRsvp.id) }}
            label="Cancel RSVP"
            pendingLabel="Cancelling…"
            variant="outline"
            size="sm"
          />
        </div>
      ) : (
        <ActionButton
          action={rsvpToEvent}
          hiddenFields={{ eventId: String(event.id) }}
          label="RSVP to this event"
          pendingLabel="Saving…"
          variant="default"
          className="h-10"
        />
      )}

      <Separator />

      <div className="flex flex-col gap-4">
        <h2 className="text-2xl">Seniors at this event</h2>
        {tickets.docs.length === 0 ? (
          <p className="leading-relaxed text-muted-foreground">
            No tickets linked yet. Staff will add seniors as they sign up.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {tickets.docs.map((ticket: Ticket) => (
              <li key={ticket.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {ticket.seniorName}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ticket.device ? `${deviceLabels[ticket.device] || ticket.device} · ` : ''}
                  {ticket.issue}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
