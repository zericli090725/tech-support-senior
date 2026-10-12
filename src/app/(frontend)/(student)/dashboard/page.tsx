import Link from 'next/link'

import { PageIntro } from '@/app/(frontend)/components/PageIntro'
import { StudentStatus } from '@/app/(frontend)/components/StudentStatus'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { requireStudent } from '@/lib/auth'
import { formatDateTime, formatHours, getDocName } from '@/lib/format'
import type { Event, HourLog, Ticket } from '@/payload-types'

export default async function DashboardPage() {
  const { user, payload } = await requireStudent()

  const [tickets, rsvps, memberships, hourLogs] = await Promise.all([
    payload.find({
      collection: 'tickets',
      where: { assignedStudent: { equals: user.id } },
      sort: 'scheduledAt',
      depth: 1,
      limit: 20,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'event-rsvps',
      where: {
        and: [{ student: { equals: user.id } }, { status: { equals: 'going' } }],
      },
      depth: 2,
      limit: 20,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'center-memberships',
      where: { student: { equals: user.id } },
      depth: 1,
      limit: 20,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'hour-logs',
      where: { student: { equals: user.id } },
      limit: 200,
      depth: 0,
      user,
      overrideAccess: false,
    }),
  ])

  const totalHours = hourLogs.docs.reduce((sum: number, log: HourLog) => sum + (log.hours || 0), 0)
  const approvedCount = memberships.docs.filter((m) => m.status === 'approved').length
  const now = Date.now()
  const upcomingRsvps = rsvps.docs.filter((rsvp) => {
    const event = typeof rsvp.event === 'object' ? (rsvp.event as Event) : null
    return Boolean(event?.startsAt && new Date(event.startsAt).getTime() >= now)
  })

  return (
    <div className="flex flex-col gap-10">
      <PageIntro
        eyebrow="Welcome back"
        title="Your dashboard"
        description={`${formatHours(totalHours)} logged · ${approvedCount} approved ${approvedCount === 1 ? 'center' : 'centers'}`}
      />

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))]">
        <Card className="h-full">
          <CardHeader>
            <h2 className="text-2xl">Assigned tickets</h2>
          </CardHeader>
          <CardContent>
            {tickets.docs.length === 0 ? (
              <p className="leading-relaxed text-muted-foreground">
                No tickets yet.{' '}
                <Link href="/tickets" className="text-foreground underline underline-offset-4">
                  Browse open tickets
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {tickets.docs.map((ticket: Ticket) => (
                  <li key={ticket.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {ticket.seniorName} · {getDocName(ticket.center)}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <StudentStatus status={ticket.status} />
                      <span>{formatDateTime(ticket.scheduledAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <h2 className="text-2xl">Upcoming events</h2>
          </CardHeader>
          <CardContent>
            {upcomingRsvps.length === 0 ? (
              <p className="leading-relaxed text-muted-foreground">
                No upcoming events.{' '}
                <Link href="/events" className="text-foreground underline underline-offset-4">
                  See events
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {upcomingRsvps.map((rsvp) => {
                  const event = typeof rsvp.event === 'object' ? (rsvp.event as Event) : null
                  if (!event) return null
                  return (
                    <li key={rsvp.id} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        href={`/events/${event.id}`}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {event.title}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getDocName(event.center)} · {formatDateTime(event.startsAt)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <h2 className="text-2xl">Centers</h2>
          </CardHeader>
          <CardContent>
            {memberships.docs.length === 0 ? (
              <p className="leading-relaxed text-muted-foreground">
                <Link href="/centers" className="text-foreground underline underline-offset-4">
                  Request to join a center
                </Link>{' '}
                to start volunteering.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {memberships.docs.map((membership) => (
                  <li key={membership.id} className="flex flex-wrap items-center gap-2 py-3 first:pt-0 last:pb-0">
                    <span className="font-medium">{getDocName(membership.center)}</span>
                    <StudentStatus status={membership.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
