import Link from 'next/link'

import { ListFilters, Pager } from '@/app/(frontend)/staff/components/ListControls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { centerChoices } from '@/app/(frontend)/staff/options'
import { PAGE_SIZE, andWhere, readPage, readParam, searchWhere } from '@/app/(frontend)/staff/queries'
import { requireSuperAdmin } from '@/lib/auth'
import { getDocName, roleLabels } from '@/lib/format'

type Props = {
  searchParams: Promise<{ q?: string; center?: string; page?: string }>
}

export default async function TeamPage({ searchParams }: Props) {
  const { user, payload } = await requireSuperAdmin()
  const params = await searchParams
  const q = readParam(params.q)
  const center = readParam(params.center)
  const page = readPage(params.page)
  const centers = await centerChoices({ user, payload })

  const users = await payload.find({
    collection: 'users',
    where: andWhere([
      searchWhere(['name', 'email'], q),
      center ? { center: { equals: center } } : undefined,
    ]),
    sort: 'name',
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
          <h1>Team</h1>
          <p className="text-muted-foreground">
            {users.totalDocs} staff {users.totalDocs === 1 ? 'account' : 'accounts'}. Super admins can
            create accounts, assign a center, and change roles.
          </p>
        </div>
        <Button asChild>
          <Link href="/staff/team/new">New staff user</Link>
        </Button>
      </div>
      <ListFilters query={q} placeholder="Name or email" center={center} centers={centers} />
      {users.docs.length === 0 ? (
        <p className="text-muted-foreground">{q || center ? 'Nothing matches those filters.' : 'No staff accounts yet.'}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {users.docs.map((member) => (
            <li className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10" key={member.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/staff/team/${member.id}`}>{member.name}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{member.email}</div>
                </div>
                <Badge variant="secondary">{roleLabels[member.role] || member.role}</Badge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{member.center ? getDocName(member.center) : 'All centers'}</p>
            </li>
          ))}
        </ul>
      )}
      <Pager page={users.page || page} totalPages={users.totalPages} path="/staff/team" params={{ q, center }} />
    </section>
  )
}
