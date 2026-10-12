import Link from 'next/link'

import { isSuperAdmin } from '@/access/roles'
import { Button } from '@/components/ui/button'
import { ListFilters, Pager } from '@/app/(frontend)/staff/components/ListControls'
import { PAGE_SIZE, readPage, readParam, searchWhere } from '@/app/(frontend)/staff/queries'
import { requireStaff } from '@/lib/auth'

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function StaffCentersPage({ searchParams }: Props) {
  const { user, payload } = await requireStaff()
  const params = await searchParams
  const q = readParam(params.q)
  const page = readPage(params.page)
  const superAdmin = isSuperAdmin(user)

  const centers = await payload.find({
    collection: 'centers',
    where: searchWhere(['name', 'address', 'notes'], q),
    sort: 'name',
    depth: 0,
    page,
    limit: PAGE_SIZE,
    user,
    overrideAccess: false,
  })

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>Centers</h1>
          <p className="text-muted-foreground">
            {centers.totalDocs} senior {centers.totalDocs === 1 ? 'center' : 'centers'}.
            {superAdmin ? ' You can add, edit, and delete them.' : ' You can read every center.'}
          </p>
        </div>
        {superAdmin ? (
          <Button asChild>
            <Link href="/staff/centers/new">New center</Link>
          </Button>
        ) : null}
      </div>
      <ListFilters query={q} placeholder="Name, address, or notes" />
      {centers.docs.length === 0 ? (
        <p className="text-muted-foreground">{q ? 'Nothing matches that search.' : 'No centers yet.'}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {centers.docs.map((center) => (
            <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10" key={center.id}>
              <h2>
                <Link href={`/staff/centers/${center.id}`}>{center.name}</Link>
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{center.address || 'No address listed'}</p>
              {center.notes ? <p>{center.notes}</p> : null}
            </article>
          ))}
        </div>
      )}
      <Pager page={centers.page || page} totalPages={centers.totalPages} path="/staff/centers" params={{ q }} />
    </section>
  )
}
