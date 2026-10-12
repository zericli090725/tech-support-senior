import Link from 'next/link'

import { isSuperAdmin } from '@/access/roles'
import { Button } from '@/components/ui/button'
import { FilterPills, ListFilters, Pager } from '@/app/(frontend)/staff/components/ListControls'
import { centerChoices } from '@/app/(frontend)/staff/options'
import { PAGE_SIZE, andWhere, readPage, readParam, searchWhere } from '@/app/(frontend)/staff/queries'
import { requireStaff } from '@/lib/auth'
import { formatDateTime, getDocName } from '@/lib/format'
import type { Event } from '@/payload-types'

type Props = {
  searchParams: Promise<{ q?: string; when?: string; center?: string; page?: string }>
}

export default async function StaffEventsPage({ searchParams }: Props) {
  const { user, payload } = await requireStaff()
  const params = await searchParams
  const q = readParam(params.q)
  const when = readParam(params.when) === 'past' ? 'past' : readParam(params.when) === 'upcoming' ? 'upcoming' : ''
  const center = readParam(params.center)
  const page = readPage(params.page)
  const superAdmin = isSuperAdmin(user)
  const centers = superAdmin ? await centerChoices({ user, payload }) : undefined
  const now = new Date().toISOString()

  const events = await payload.find({
    collection: 'events',
    where: andWhere([
      searchWhere(['title', 'description', 'locationInCenter'], q),
      when === 'upcoming' ? { startsAt: { greater_than_equal: now } } : undefined,
      when === 'past' ? { startsAt: { less_than: now } } : undefined,
      superAdmin && center ? { center: { equals: center } } : undefined,
    ]),
    sort: 'startsAt',
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
          <h1>Events</h1>
          <p className="text-muted-foreground">
            {events.totalDocs} group {events.totalDocs === 1 ? 'day' : 'days'}.
          </p>
        </div>
        <Button asChild>
          <Link href="/staff/events/new">New event</Link>
        </Button>
      </div>
      <ListFilters
        query={q}
        placeholder="Title or description"
        center={center}
        centers={centers}
        preserve={{ when }}
      />
      <FilterPills
        path="/staff/events"
        param="when"
        value={when}
        extra={{ q, center }}
        options={[
          { value: '', label: 'All' },
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'past', label: 'Past' },
        ]}
      />
      {events.docs.length === 0 ? (
        <p className="text-muted-foreground">{q || when || center ? 'Nothing matches those filters.' : 'No events yet.'}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.docs.map((event: Event) => (
            <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10" key={event.id}>
              <h2>
                <Link href={`/staff/events/${event.id}`}>{event.title}</Link>
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {getDocName(event.center)}
                {event.locationInCenter ? ` · ${event.locationInCenter}` : ''}
              </p>
              <p>{formatDateTime(event.startsAt)}</p>
              {event.description ? <p className="text-muted-foreground">{event.description}</p> : null}
            </article>
          ))}
        </div>
      )}
      <Pager
        page={events.page || page}
        totalPages={events.totalPages}
        path="/staff/events"
        params={{ q, when, center }}
      />
    </section>
  )
}
