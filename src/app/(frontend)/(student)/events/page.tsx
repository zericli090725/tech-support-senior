import Link from 'next/link'

import { ActionButton } from '@/app/(frontend)/components/ActionButton'
import { PageIntro } from '@/app/(frontend)/components/PageIntro'
import { StudentStatus } from '@/app/(frontend)/components/StudentStatus'
import { rsvpToEvent } from '@/app/(frontend)/actions/events'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { requireStudent } from '@/lib/auth'
import { formatDateTime, getDocName } from '@/lib/format'
import { getRelationID } from '@/lib/getRelationID'
import type { Event, EventRsvp } from '@/payload-types'

export default async function EventsPage() {
  const { user, payload } = await requireStudent()

  const [events, rsvps] = await Promise.all([
    payload.find({
      collection: 'events',
      where: {
        startsAt: { greater_than_equal: new Date().toISOString() },
      },
      sort: 'startsAt',
      depth: 1,
      limit: 50,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'event-rsvps',
      where: { student: { equals: user.id } },
      depth: 0,
      limit: 100,
      user,
      overrideAccess: false,
    }),
  ])

  const rsvpByEvent = new Map<string, EventRsvp>()
  for (const rsvp of rsvps.docs) {
    const eventID = getRelationID(rsvp.event)
    if (eventID) rsvpByEvent.set(eventID, rsvp)
  }

  return (
    <div className="flex flex-col gap-10">
      <PageIntro
        title="Events"
        description="Group help days at centers where you are an approved volunteer."
      />
      {events.docs.length === 0 ? (
        <p className="max-w-xl leading-relaxed text-muted-foreground">
          No upcoming events at your approved centers.
        </p>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))]">
          {events.docs.map((event: Event) => {
            const rsvp = rsvpByEvent.get(String(event.id))
            return (
              <Card as="article" className="h-full" key={event.id}>
                <CardHeader>
                  <h2 className="text-2xl">{event.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {getDocName(event.center)}
                    {event.locationInCenter ? ` · ${event.locationInCenter}` : ''}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p>{formatDateTime(event.startsAt)}</p>
                  {event.description ? (
                    <p className="leading-relaxed text-muted-foreground">{event.description}</p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/events/${event.id}`}>Details</Link>
                    </Button>
                    {rsvp?.status === 'going' ? (
                      <StudentStatus status="going" />
                    ) : (
                      <ActionButton
                        action={rsvpToEvent}
                        hiddenFields={{ eventId: String(event.id) }}
                        label="RSVP"
                        pendingLabel="Saving…"
                        variant="default"
                        size="sm"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
