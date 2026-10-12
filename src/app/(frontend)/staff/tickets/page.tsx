import Link from 'next/link'

import { isSuperAdmin } from '@/access/roles'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/app/(frontend)/components/StatusBadge'
import { FilterPills, ListFilters, Pager } from '@/app/(frontend)/staff/components/ListControls'
import { centerChoices } from '@/app/(frontend)/staff/options'
import { PAGE_SIZE, andWhere, oneOf, readPage, readParam, searchWhere } from '@/app/(frontend)/staff/queries'
import { requireStaff } from '@/lib/auth'
import { deviceLabels, formatDateTime, getDocName } from '@/lib/format'
import type { Ticket } from '@/payload-types'

const statuses = ['open', 'assigned', 'completed', 'cancelled'] as const

type Props = {
  searchParams: Promise<{ q?: string; status?: string; center?: string; page?: string }>
}

export default async function StaffTicketsPage({ searchParams }: Props) {
  const { user, payload } = await requireStaff()
  const params = await searchParams
  const q = readParam(params.q)
  const status = oneOf(readParam(params.status), statuses)
  const center = readParam(params.center)
  const page = readPage(params.page)
  const superAdmin = isSuperAdmin(user)
  const centers = superAdmin ? await centerChoices({ user, payload }) : undefined

  const tickets = await payload.find({
    collection: 'tickets',
    where: andWhere([
      searchWhere(['seniorName', 'issue'], q),
      status ? { status: { equals: status } } : undefined,
      superAdmin && center ? { center: { equals: center } } : undefined,
    ]),
    sort: '-createdAt',
    depth: 1,
    page,
    limit: PAGE_SIZE,
    user,
    overrideAccess: false,
  })

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>Tickets</h1>
          <p className="text-muted-foreground">
            {tickets.totalDocs} {tickets.totalDocs === 1 ? 'ticket' : 'tickets'} at{' '}
            {superAdmin ? 'every center' : 'your center'}.
          </p>
        </div>
        <Button asChild>
          <Link href="/staff/tickets/new">New ticket</Link>
        </Button>
      </div>
      <ListFilters
        query={q}
        placeholder="Senior name or issue"
        center={center}
        centers={centers}
        preserve={{ status }}
      />
      <FilterPills
        path="/staff/tickets"
        param="status"
        value={status}
        extra={{ q, center }}
        options={[
          { value: '', label: 'All' },
          { value: 'open', label: 'Open' },
          { value: 'assigned', label: 'Assigned' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
      />
      {tickets.docs.length === 0 ? (
        <p className="text-muted-foreground">{q || status || center ? 'Nothing matches those filters.' : 'No tickets yet.'}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tickets.docs.map((ticket: Ticket) => (
            <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10" key={ticket.id}>
              <div className="flex items-start justify-between gap-3">
                <h2>
                  <Link href={`/staff/tickets/${ticket.id}`}>{ticket.seniorName}</Link>
                </h2>
                <StatusBadge status={ticket.status} />
              </div>
              <p>{ticket.issue}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {getDocName(ticket.center)}
                {typeof ticket.senior === 'object' && ticket.senior ? (
                  <>
                    {' · '}
                    <Link href={`/staff/seniors/${ticket.senior.id}`}>Profile</Link>
                  </>
                ) : null}
                {ticket.device ? ` · ${deviceLabels[ticket.device] || ticket.device}` : ''}
                {ticket.assignedStudent ? ` · ${getDocName(ticket.assignedStudent)}` : ''}
                {ticket.scheduledAt ? ` · ${formatDateTime(ticket.scheduledAt)}` : ''}
              </p>
            </article>
          ))}
        </div>
      )}
      <Pager
        page={tickets.page || page}
        totalPages={tickets.totalPages}
        path="/staff/tickets"
        params={{ q, status, center }}
      />
    </section>
  )
}
