import Link from 'next/link'

import { isSuperAdmin } from '@/access/roles'
import { ActionButton } from '@/app/(frontend)/components/ActionButton'
import { StatusBadge } from '@/app/(frontend)/components/StatusBadge'
import { createMembership, deleteMembership, setMembershipStatus } from '@/app/(frontend)/actions/staff'
import { ConfirmButton } from '@/app/(frontend)/staff/components/ConfirmButton'
import { SelectField } from '@/app/(frontend)/staff/components/fields'
import { FilterPills, ListFilters, Pager } from '@/app/(frontend)/staff/components/ListControls'
import { StaffForm } from '@/app/(frontend)/staff/components/StaffForm'
import { centerChoices, studentChoices } from '@/app/(frontend)/staff/options'
import { PAGE_SIZE, andWhere, oneOf, readPage, readParam } from '@/app/(frontend)/staff/queries'
import { requireStaff } from '@/lib/auth'
import { getDocName } from '@/lib/format'
import { getRelationID } from '@/lib/getRelationID'

const statuses = ['pending', 'approved', 'rejected'] as const

type Props = {
  searchParams: Promise<{ status?: string; center?: string; page?: string }>
}

export default async function MembershipsPage({ searchParams }: Props) {
  const { user, payload } = await requireStaff()
  const params = await searchParams
  const status = oneOf(readParam(params.status), statuses)
  const center = readParam(params.center)
  const page = readPage(params.page)
  const superAdmin = isSuperAdmin(user)

  const [memberships, centers, students] = await Promise.all([
    payload.find({
      collection: 'center-memberships',
      where: andWhere([
        status ? { status: { equals: status } } : undefined,
        superAdmin && center ? { center: { equals: center } } : undefined,
      ]),
      sort: '-createdAt',
      depth: 1,
      page,
      limit: PAGE_SIZE,
      user,
      overrideAccess: false,
    }),
    superAdmin ? centerChoices({ user, payload }) : Promise.resolve(undefined),
    superAdmin ? studentChoices({ user, payload }) : Promise.resolve(undefined),
  ])

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1>Volunteers</h1>
        <p className="text-muted-foreground">
          Approve students before they can claim tickets or RSVP. {memberships.totalDocs}{' '}
          {memberships.totalDocs === 1 ? 'membership' : 'memberships'}.
        </p>
      </div>
      {superAdmin && centers && students ? (
        <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
          <h2>Add a membership</h2>
          <StaffForm action={createMembership} submitLabel="Add membership">
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField label="Student" name="student" required defaultValue="">
                <option value="">Choose a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.label}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Center" name="center" required defaultValue="">
                <option value="">Choose a center</option>
                {centers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </SelectField>
            </div>
            <SelectField label="Status" name="status" defaultValue="approved">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Not approved</option>
            </SelectField>
          </StaffForm>
        </article>
      ) : null}
      <ListFilters center={center} centers={centers} preserve={{ status }} />
      <FilterPills
        path="/staff/memberships"
        param="status"
        value={status}
        extra={{ center }}
        options={[
          { value: '', label: 'All' },
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Not approved' },
        ]}
      />
      {memberships.docs.length === 0 ? (
        <p className="text-muted-foreground">{status || center ? 'Nothing matches those filters.' : 'No memberships yet.'}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {memberships.docs.map((membership) => {
            const studentId = getRelationID(membership.student)
            return (
              <li className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10" key={membership.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {studentId ? (
                      <Link href={`/staff/students/${studentId}`}>{getDocName(membership.student)}</Link>
                    ) : (
                      getDocName(membership.student)
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{getDocName(membership.center)}</div>
                  </div>
                  <StatusBadge status={membership.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {membership.status !== 'approved' ? (
                    <ActionButton
                      action={setMembershipStatus}
                      hiddenFields={{ id: String(membership.id), status: 'approved' }}
                      label="Approve"
                      pendingLabel="Saving…"
                    />
                  ) : null}
                  {membership.status !== 'rejected' ? (
                    <ActionButton
                      action={setMembershipStatus}
                      hiddenFields={{ id: String(membership.id), status: 'rejected' }}
                      label="Reject"
                      pendingLabel="Saving…"
                      variant="outline"
                    />
                  ) : null}
                  {membership.status !== 'pending' ? (
                    <ActionButton
                      action={setMembershipStatus}
                      hiddenFields={{ id: String(membership.id), status: 'pending' }}
                      label="Mark pending"
                      pendingLabel="Saving…"
                      variant="outline"
                    />
                  ) : null}
                  {superAdmin ? (
                    <ConfirmButton
                      action={deleteMembership}
                      hiddenFields={{ id: String(membership.id) }}
                      label="Remove"
                      confirmMessage="Remove this membership?"
                    />
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <Pager
        page={memberships.page || page}
        totalPages={memberships.totalPages}
        path="/staff/memberships"
        params={{ status, center }}
      />
    </section>
  )
}
