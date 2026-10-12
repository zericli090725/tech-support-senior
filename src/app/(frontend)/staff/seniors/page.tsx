import Link from 'next/link'

import { isSuperAdmin } from '@/access/roles'
import { ListFilters, Pager } from '@/app/(frontend)/staff/components/ListControls'
import { centerChoices } from '@/app/(frontend)/staff/options'
import { PAGE_SIZE, andWhere, readPage, readParam, searchWhere } from '@/app/(frontend)/staff/queries'
import { Button } from '@/components/ui/button'
import { requireStaff } from '@/lib/auth'
import { formatSeniorContact, getDocName } from '@/lib/format'

type Props = {
  searchParams: Promise<{ q?: string; center?: string; page?: string }>
}

export default async function StaffSeniorsPage({ searchParams }: Props) {
  const { user, payload } = await requireStaff()
  const params = await searchParams
  const q = readParam(params.q)
  const center = readParam(params.center)
  const page = readPage(params.page)
  const superAdmin = isSuperAdmin(user)
  const centers = superAdmin ? await centerChoices({ user, payload }) : undefined

  const seniors = await payload.find({
    collection: 'seniors',
    where: andWhere([
      searchWhere(['name', 'firstName', 'lastName', 'contact'], q),
      superAdmin && center ? { center: { equals: center } } : undefined,
    ]),
    sort: 'lastName',
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
          <h1>Seniors</h1>
          <p className="text-muted-foreground">
            {seniors.totalDocs} {seniors.totalDocs === 1 ? 'profile' : 'profiles'} at{' '}
            {superAdmin ? 'every center' : 'your center'}. Open one to see their tickets.
          </p>
        </div>
        <Button asChild>
          <Link href="/staff/seniors/new">New senior</Link>
        </Button>
      </div>
      <ListFilters query={q} placeholder="Name or contact" center={center} centers={centers} />
      {seniors.docs.length === 0 ? (
        <p className="text-muted-foreground">{q || center ? 'Nothing matches those filters.' : 'No senior profiles yet.'}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {seniors.docs.map((senior) => (
            <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10" key={senior.id}>
              <h2>
                <Link href={`/staff/seniors/${senior.id}`}>{senior.name}</Link>
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {formatSeniorContact(senior.contactMethod, senior.contact)}
                {superAdmin ? ` · ${getDocName(senior.center)}` : ''}
              </p>
            </article>
          ))}
        </div>
      )}
      <Pager
        page={seniors.page || page}
        totalPages={seniors.totalPages}
        path="/staff/seniors"
        params={{ q, center }}
      />
    </section>
  )
}
