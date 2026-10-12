import Link from 'next/link'
import { notFound } from 'next/navigation'

import { isSuperAdmin } from '@/access/roles'
import { StatusBadge } from '@/app/(frontend)/components/StatusBadge'
import { deleteStudent, saveStudent } from '@/app/(frontend)/actions/staff'
import { ConfirmButton } from '@/app/(frontend)/staff/components/ConfirmButton'
import { TextField } from '@/app/(frontend)/staff/components/fields'
import { StaffForm } from '@/app/(frontend)/staff/components/StaffForm'
import { Button } from '@/components/ui/button'
import { requireStaff } from '@/lib/auth'
import { formatDate, formatHours, getDocName } from '@/lib/format'
import type { HourLog, Ticket } from '@/payload-types'

type Props = {
  params: Promise<{ id: string }>
}

export default async function StaffStudentPage({ params }: Props) {
  const { id } = await params
  const { user, payload } = await requireStaff()
  const superAdmin = isSuperAdmin(user)

  let student
  try {
    student = await payload.findByID({
      collection: 'students',
      id,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  const [memberships, tickets, hourLogs] = await Promise.all([
    payload.find({
      collection: 'center-memberships',
      where: { student: { equals: id } },
      depth: 1,
      limit: 50,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'tickets',
      where: { assignedStudent: { equals: id } },
      sort: '-createdAt',
      depth: 1,
      limit: 20,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'hour-logs',
      where: { student: { equals: id } },
      sort: '-date',
      depth: 1,
      limit: 20,
      user,
      overrideAccess: false,
    }),
  ])

  const totalHours = hourLogs.docs.reduce((sum: number, log: HourLog) => sum + (log.hours || 0), 0)

  return (
    <section className="flex flex-col gap-6">
      <p>
        <Link href="/staff/students">← Students</Link>
      </p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>{student.name}</h1>
          <p className="text-muted-foreground">
            {student.email} · {formatHours(totalHours)} logged
          </p>
        </div>
        {superAdmin ? (
          <Button asChild variant="secondary">
            <Link href={`/staff/hours/new?student=${student.id}`}>Log hours</Link>
          </Button>
        ) : null}
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
          {superAdmin ? (
            <>
              <h2>Account</h2>
              <StaffForm action={saveStudent} submitLabel="Save student">
                <input type="hidden" name="id" value={String(student.id)} />
                <TextField label="Name" name="name" required defaultValue={student.name} />
                <TextField label="Email" name="email" type="email" required defaultValue={student.email} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="New password" name="password" type="password" autoComplete="new-password" />
                  <TextField
                    label="Confirm password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                  />
                </div>
                <p className="text-muted-foreground">Leave the password blank to keep the current one.</p>
              </StaffForm>
              <ConfirmButton
                action={deleteStudent}
                hiddenFields={{ id: String(student.id) }}
                label="Delete student"
                confirmMessage={`Delete ${student.name}'s account?`}
              />
            </>
          ) : (
            <>
              <h2>Account</h2>
              <p className="text-muted-foreground">Center staff can view students. A super admin can edit the account.</p>
              <dl className="grid gap-4 text-sm [&_dt]:font-medium [&_dt]:text-muted-foreground">
                <div>
                  <dt>Name</dt>
                  <dd>{student.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{student.email}</dd>
                </div>
              </dl>
            </>
          )}
        </article>
        <div className="flex flex-col gap-6">
          <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
            <h2>Center memberships</h2>
            {memberships.docs.length === 0 ? (
              <p className="text-muted-foreground">No memberships you can see.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {memberships.docs.map((membership) => (
                  <li key={membership.id}>
                    {getDocName(membership.center)} <StatusBadge status={membership.status} />
                  </li>
                ))}
              </ul>
            )}
            <p>
              <Link href="/staff/memberships">Manage volunteers</Link>
            </p>
          </article>
          <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
            <h2>Assigned tickets</h2>
            {tickets.docs.length === 0 ? (
              <p className="text-muted-foreground">No assigned tickets.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {tickets.docs.map((ticket: Ticket) => (
                  <li key={ticket.id}>
                    <Link href={`/staff/tickets/${ticket.id}`}>{ticket.seniorName}</Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <StatusBadge status={ticket.status} /> {getDocName(ticket.center)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
          <article className="flex flex-col gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
            <h2>Hour log</h2>
            {hourLogs.docs.length === 0 ? (
              <p className="text-muted-foreground">No hours logged.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {hourLogs.docs.map((log: HourLog) => (
                  <li key={log.id}>
                    <Link href={`/staff/hours/${log.id}`}>
                      {formatHours(log.hours)} on {formatDate(log.date)}
                    </Link>
                    {log.notes ? <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{log.notes}</div> : null}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </div>
    </section>
  )
}
