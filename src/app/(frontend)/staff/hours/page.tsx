import Link from 'next/link'

import { isSuperAdmin } from '@/access/roles'
import { Button } from '@/components/ui/button'
import { ListFilters, Pager } from '@/app/(frontend)/staff/components/ListControls'
import { centerChoices } from '@/app/(frontend)/staff/options'
import { PAGE_SIZE, andWhere, readPage, readParam } from '@/app/(frontend)/staff/queries'
import { requireStaff } from '@/lib/auth'
import { formatDate, formatHours, getDocName } from '@/lib/format'
import { getRelationID } from '@/lib/getRelationID'
import type { HourLog } from '@/payload-types'
import type { Where } from 'payload'

type Props = {
  searchParams: Promise<{ q?: string; center?: string; page?: string }>
}

export default async function StaffHoursPage({ searchParams }: Props) {
  const { user, payload } = await requireStaff()
  const params = await searchParams
  const q = readParam(params.q)
  const center = readParam(params.center)
  const page = readPage(params.page)
  const superAdmin = isSuperAdmin(user)
  const centers = superAdmin ? await centerChoices({ user, payload }) : undefined

  let studentMatch: Where | undefined
  if (q) {
    const students = await payload.find({
      collection: 'students',
      where: { or: [{ name: { contains: q } }, { email: { contains: q } }] },
      limit: 50,
      depth: 0,
      user,
      overrideAccess: false,
    })
    const ids = students.docs.map((student) => String(student.id))
    studentMatch = ids.length > 0 ? { student: { in: ids } } : undefined
  }

  let centerMatch: Where | undefined
  if (superAdmin && center) {
    const memberships = await payload.find({
      collection: 'center-memberships',
      where: { and: [{ center: { equals: center } }, { status: { equals: 'approved' } }] },
      limit: 300,
      depth: 0,
      user,
      overrideAccess: false,
    })
    const ids = memberships.docs
      .map((membership) => getRelationID(membership.student))
      .filter((id): id is string => Boolean(id))
    centerMatch = { student: { in: ids.length > 0 ? ids : ['__none__'] } }
  }

  const textMatch: Where | undefined = q
    ? {
        or: [{ notes: { contains: q } }, ...(studentMatch ? [studentMatch] : [])],
      }
    : undefined

  const logs = await payload.find({
    collection: 'hour-logs',
    where: andWhere([textMatch, centerMatch]),
    sort: '-date',
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
          <h1>Hours</h1>
          <p className="text-muted-foreground">
            Volunteer time logged by students.
            {superAdmin ? ' You can add, edit, and delete logs.' : ' You can review logs for your center.'}
          </p>
        </div>
        {superAdmin ? (
          <Button asChild>
            <Link href="/staff/hours/new">Log hours</Link>
          </Button>
        ) : null}
      </div>
      <ListFilters query={q} placeholder="Student or notes" center={center} centers={centers} />
      {logs.docs.length === 0 ? (
        <p className="text-muted-foreground">{q || center ? 'Nothing matches those filters.' : 'No hours logged yet.'}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {logs.docs.map((log: HourLog) => (
            <li className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10" key={log.id}>
              <Link href={`/staff/hours/${log.id}`}>
                {formatHours(log.hours)} · {getDocName(log.student)}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {formatDate(log.date)}
                {log.ticket ? ` · Ticket: ${getDocName(log.ticket, 'Senior')}` : ''}
                {log.event ? ` · Event: ${getDocName(log.event)}` : ''}
              </div>
              {log.notes ? <p>{log.notes}</p> : null}
            </li>
          ))}
        </ul>
      )}
      <Pager page={logs.page || page} totalPages={logs.totalPages} path="/staff/hours" params={{ q, center }} />
    </section>
  )
}
