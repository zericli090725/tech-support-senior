import { ActionButton } from '@/app/(frontend)/components/ActionButton'
import { HourLogForm } from '@/app/(frontend)/components/HourLogForm'
import { deleteHourLog } from '@/app/(frontend)/actions/hours'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { requireStudent } from '@/lib/auth'
import { formatDate, formatHours, getDocName } from '@/lib/format'
import type { Event, HourLog, Ticket } from '@/payload-types'

export default async function ProfilePage() {
  const { user, payload } = await requireStudent()

  const [student, hourLogs, tickets, rsvps] = await Promise.all([
    payload.findByID({
      collection: 'students',
      id: user.id,
      depth: 0,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'hour-logs',
      where: { student: { equals: user.id } },
      sort: '-date',
      depth: 1,
      limit: 100,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'tickets',
      where: { assignedStudent: { equals: user.id } },
      depth: 0,
      limit: 50,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'event-rsvps',
      where: {
        and: [{ student: { equals: user.id } }, { status: { equals: 'going' } }],
      },
      depth: 1,
      limit: 50,
      user,
      overrideAccess: false,
    }),
  ])

  const totalHours = hourLogs.docs.reduce((sum: number, log: HourLog) => sum + (log.hours || 0), 0)

  const ticketOptions = tickets.docs.map((ticket: Ticket) => ({
    id: String(ticket.id),
    label: `${ticket.seniorName} — ${ticket.issue.slice(0, 60)}`,
  }))

  const eventOptions = rsvps.docs
    .map((rsvp) => {
      const event = typeof rsvp.event === 'object' ? (rsvp.event as Event) : null
      if (!event) return null
      return { id: String(event.id), label: event.title }
    })
    .filter((option): option is { id: string; label: string } => Boolean(option))

  return (
    <div className="flex flex-col gap-10">
      <div className="flex max-w-2xl flex-col gap-2">
        <h1 className="text-4xl leading-tight sm:text-5xl">{student.name}</h1>
        <p className="text-muted-foreground">
          {student.email} · {formatHours(totalHours)} total
        </p>
      </div>

      <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))]">
        <Card>
          <CardHeader>
            <h2 className="text-2xl">Log hours</h2>
            <CardDescription className="leading-relaxed">
              Link a ticket or event when the time was for that appointment or group day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HourLogForm tickets={ticketOptions} events={eventOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-2xl">Your hour log</h2>
          </CardHeader>
          <CardContent>
            {hourLogs.docs.length === 0 ? (
              <p className="text-muted-foreground">No hours logged yet.</p>
            ) : (
              <ul>
                {hourLogs.docs.map((log: HourLog, index) => (
                  <li key={log.id}>
                    {index > 0 ? <Separator className="my-4" /> : null}
                    <p>
                      <span className="font-medium">{formatHours(log.hours)}</span>
                      <span className="text-muted-foreground"> on {formatDate(log.date)}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {log.ticket ? `Ticket: ${getDocName(log.ticket, 'Senior')} · ` : ''}
                      {log.event ? `Event: ${getDocName(log.event)}` : ''}
                      {!log.ticket && !log.event ? 'Not linked to a ticket or event' : ''}
                    </p>
                    {log.notes ? <p className="mt-2 leading-relaxed">{log.notes}</p> : null}
                    <div className="mt-3">
                      <ActionButton
                        action={deleteHourLog}
                        hiddenFields={{ id: String(log.id) }}
                        label="Remove"
                        pendingLabel="Removing…"
                        variant="ghost"
                        size="sm"
                      />
                    </div>
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
