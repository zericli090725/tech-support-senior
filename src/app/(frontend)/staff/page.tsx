import Link from 'next/link'

import { getStaffCenterID } from '@/access/getStaffCenterID'
import { Button } from '@/components/ui/button'
import { isStaff, isSuperAdmin } from '@/access/roles'
import { StatusBadge } from '@/app/(frontend)/components/StatusBadge'
import { requireStaff } from '@/lib/auth'
import { formatDate, formatDateTime, formatHours, getDocName, roleLabels } from '@/lib/format'
import { getRelationID } from '@/lib/getRelationID'
import type { Event, HourLog, Ticket } from '@/payload-types'

export default async function StaffDashboardPage() {
  const { user, payload } = await requireStaff()
  const superAdmin = isSuperAdmin(user)

  const [profile, pendingMemberships, openTickets, upcomingEvents, recentHours] = await Promise.all([
    payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 1,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'center-memberships',
      where: { status: { equals: 'pending' } },
      sort: '-createdAt',
      depth: 1,
      limit: 6,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'tickets',
      where: { status: { equals: 'open' } },
      sort: '-createdAt',
      depth: 1,
      limit: 6,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'events',
      where: { startsAt: { greater_than_equal: new Date().toISOString() } },
      sort: 'startsAt',
      depth: 1,
      limit: 6,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'hour-logs',
      sort: '-date',
      depth: 1,
      limit: 5,
      user,
      overrideAccess: false,
    }),
  ])

  const centerName = isStaff(user) ? getDocName(profile.center) : null
  const centerID = getStaffCenterID(user)

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">{roleLabels[profile.role] || 'Staff'}</p>
          <h1>Staff dashboard</h1>
          <p className="text-muted-foreground">
            {profile.name}
            {centerName ? ` · ${centerName}` : ''}
            {` · ${pendingMemberships.totalDocs} pending ${pendingMemberships.totalDocs === 1 ? 'volunteer' : 'volunteers'}`}
            {` · ${openTickets.totalDocs} open ${openTickets.totalDocs === 1 ? 'ticket' : 'tickets'}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href="/staff/tickets/new">New ticket</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/staff/events/new">New event</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
          <h2>Pending volunteers</h2>
          {pendingMemberships.docs.length === 0 ? (
            <p className="text-muted-foreground">
              No one is waiting for approval.{' '}
              <Link href="/staff/memberships">View volunteers</Link>
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {pendingMemberships.docs.map((membership) => {
                const studentID = getRelationID(membership.student)
                const name = getDocName(membership.student)
                return (
                  <li key={membership.id}>
                    {studentID ? <Link href={`/staff/students/${studentID}`}>{name}</Link> : name}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {getDocName(membership.center)} <StatusBadge status={membership.status} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {pendingMemberships.totalDocs > 0 ? (
            <p>
              <Link href="/staff/memberships?status=pending">Review memberships</Link>
            </p>
          ) : null}
        </article>

        <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
          <h2>Open tickets</h2>
          {openTickets.docs.length === 0 ? (
            <p className="text-muted-foreground">
              No open tickets. <Link href="/staff/tickets/new">Add one</Link>
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {openTickets.docs.map((ticket: Ticket) => (
                <li key={ticket.id}>
                  <Link href={`/staff/tickets/${ticket.id}`}>{ticket.seniorName}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {getDocName(ticket.center)}
                    {ticket.scheduledAt ? ` · ${formatDateTime(ticket.scheduledAt)}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
          <h2>Upcoming events</h2>
          {upcomingEvents.docs.length === 0 ? (
            <p className="text-muted-foreground">
              Nothing scheduled. <Link href="/staff/events/new">Create an event</Link>
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {upcomingEvents.docs.map((event: Event) => (
                <li key={event.id}>
                  <Link href={`/staff/events/${event.id}`}>{event.title}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {getDocName(event.center)} · {formatDateTime(event.startsAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
          <h2>Recent hours</h2>
          {recentHours.docs.length === 0 ? (
            <p className="text-muted-foreground">No volunteer hours logged yet.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {recentHours.docs.map((log: HourLog) => (
                <li key={log.id}>
                  <Link href={`/staff/hours/${log.id}`}>
                    {formatHours(log.hours)} · {getDocName(log.student)}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{formatDate(log.date)}</div>
                </li>
              ))}
            </ul>
          )}
          {superAdmin ? (
            <p>
              <Link href="/staff/hours/new">Log hours</Link>
            </p>
          ) : null}
        </article>
      </div>
      {isStaff(user) && !centerID ? (
        <p className="text-muted-foreground">Your account is not assigned to a center yet. Ask a super admin to update it.</p>
      ) : null}
    </section>
  )
}
