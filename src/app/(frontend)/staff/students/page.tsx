import Link from 'next/link'

import { isSuperAdmin } from '@/access/roles'
import { Button } from '@/components/ui/button'
import { ListFilters, Pager } from '@/app/(frontend)/staff/components/ListControls'
import { centerChoices } from '@/app/(frontend)/staff/options'
import { PAGE_SIZE, andWhere, readPage, readParam, searchWhere } from '@/app/(frontend)/staff/queries'
import { requireStaff } from '@/lib/auth'
import { getRelationID } from '@/lib/getRelationID'
import type { Where } from 'payload'

type Props = {
  searchParams: Promise<{ q?: string; center?: string; page?: string }>
}

export default async function StaffStudentsPage({ searchParams }: Props) {
  const { user, payload } = await requireStaff()
  const params = await searchParams
  const q = readParam(params.q)
  const center = readParam(params.center)
  const page = readPage(params.page)
  const superAdmin = isSuperAdmin(user)
  const centers = superAdmin ? await centerChoices({ user, payload }) : undefined

  let centerFilter: Where | undefined
  if (superAdmin && center) {
    const memberships = await payload.find({
      collection: 'center-memberships',
      where: { center: { equals: center } },
      limit: 300,
      depth: 0,
      user,
      overrideAccess: false,
    })
    const ids = memberships.docs
      .map((membership) => getRelationID(membership.student))
      .filter((id): id is string => Boolean(id))
    centerFilter = { id: { in: ids.length > 0 ? ids : ['__none__'] } }
  }

  const students = await payload.find({
    collection: 'students',
    where: andWhere([searchWhere(['name', 'email'], q), centerFilter]),
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
          <h1>Students</h1>
          <p className="text-muted-foreground">
            {students.totalDocs} volunteer {students.totalDocs === 1 ? 'account' : 'accounts'}.
            {superAdmin ? ' You can create, edit, and delete them.' : ' Staff can view accounts.'}
          </p>
        </div>
        {superAdmin ? (
          <Button asChild>
            <Link href="/staff/students/new">New student</Link>
          </Button>
        ) : null}
      </div>
      <ListFilters query={q} placeholder="Name or email" center={center} centers={centers} />
      {students.docs.length === 0 ? (
        <p className="text-muted-foreground">{q || center ? 'Nothing matches those filters.' : 'No students yet.'}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {students.docs.map((student) => (
            <li className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10" key={student.id}>
              <Link href={`/staff/students/${student.id}`}>{student.name}</Link>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{student.email}</div>
            </li>
          ))}
        </ul>
      )}
      <Pager
        page={students.page || page}
        totalPages={students.totalPages}
        path="/staff/students"
        params={{ q, center }}
      />
    </section>
  )
}
