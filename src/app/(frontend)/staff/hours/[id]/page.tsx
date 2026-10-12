import Link from 'next/link'
import { notFound } from 'next/navigation'

import { isSuperAdmin } from '@/access/roles'
import { deleteHourLogAsStaff } from '@/app/(frontend)/actions/staff'
import { ConfirmButton } from '@/app/(frontend)/staff/components/ConfirmButton'
import { HourLogAdminForm } from '@/app/(frontend)/staff/components/HourLogAdminForm'
import { hourLogChoices } from '@/app/(frontend)/staff/options'
import { requireStaff } from '@/lib/auth'
import { dateInputFromStored, formatDate, formatHours, getDocName } from '@/lib/format'
import { getRelationID } from '@/lib/getRelationID'

type Props = {
  params: Promise<{ id: string }>
}

export default async function StaffHourLogPage({ params }: Props) {
  const { id } = await params
  const auth = await requireStaff()
  const { user, payload } = auth
  const superAdmin = isSuperAdmin(user)

  let log
  try {
    log = await payload.findByID({
      collection: 'hour-logs',
      id,
      depth: 1,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  const choices = superAdmin ? await hourLogChoices(auth) : null

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p>
        <Link href="/staff/hours">← Hours</Link>
      </p>
      <h1>
        {formatHours(log.hours)} · {getDocName(log.student)}
      </h1>
      {superAdmin && choices ? (
        <>
          <HourLogAdminForm
            students={choices.students}
            tickets={choices.tickets}
            events={choices.events}
            defaults={{
              id: String(log.id),
              studentId: getRelationID(log.student) || '',
              hours: log.hours,
              date: dateInputFromStored(log.date),
              notes: log.notes,
              ticketId: getRelationID(log.ticket) || '',
              eventId: getRelationID(log.event) || '',
            }}
            submitLabel="Save hours"
          />
          <ConfirmButton
            action={deleteHourLogAsStaff}
            hiddenFields={{ id: String(log.id) }}
            label="Delete hour log"
            confirmMessage="Delete this hour log?"
          />
        </>
      ) : (
        <dl className="grid gap-4 text-sm [&_dt]:font-medium [&_dt]:text-muted-foreground">
          <div>
            <dt>Student</dt>
            <dd>{getDocName(log.student)}</dd>
          </div>
          <div>
            <dt>Hours</dt>
            <dd>{formatHours(log.hours)}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{formatDate(log.date)}</dd>
          </div>
          <div>
            <dt>Ticket</dt>
            <dd>{log.ticket ? getDocName(log.ticket, 'Senior') : 'None'}</dd>
          </div>
          <div>
            <dt>Event</dt>
            <dd>{log.event ? getDocName(log.event) : 'None'}</dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd>{log.notes || 'None'}</dd>
          </div>
        </dl>
      )}
    </section>
  )
}
