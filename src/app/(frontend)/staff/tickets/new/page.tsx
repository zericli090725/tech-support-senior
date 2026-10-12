import Link from 'next/link'

import { getStaffCenterID } from '@/access/getStaffCenterID'
import { isStaff } from '@/access/roles'
import { TicketForm } from '@/app/(frontend)/staff/components/TicketForm'
import { approvedStudentChoices, centerChoices, eventChoices, seniorChoices } from '@/app/(frontend)/staff/options'
import { readParam } from '@/app/(frontend)/staff/queries'
import { requireStaff } from '@/lib/auth'
import { getRelationID } from '@/lib/getRelationID'

type Props = {
  searchParams: Promise<{ event?: string; senior?: string }>
}

export default async function NewTicketPage({ searchParams }: Props) {
  const auth = await requireStaff()
  const params = await searchParams
  const [centers, seniors, events, students] = await Promise.all([
    centerChoices(auth),
    seniorChoices(auth),
    eventChoices(auth),
    approvedStudentChoices(auth),
  ])
  const lockCenterId = getStaffCenterID(auth.user)
  let eventId = readParam(params.event)
  let centerId = lockCenterId || ''
  const matched = events.find((event) => event.id === eventId)
  if (!matched || (lockCenterId && matched.centerId !== lockCenterId)) eventId = ''
  else centerId = matched.centerId

  let seniorId = readParam(params.senior)
  if (seniorId) {
    try {
      const senior = await auth.payload.findByID({
        collection: 'seniors',
        id: seniorId,
        depth: 0,
        user: auth.user,
        overrideAccess: false,
      })
      const seniorCenter = getRelationID(senior.center) || ''
      if (!seniorCenter || (lockCenterId && seniorCenter !== lockCenterId)) seniorId = ''
      else {
        if (eventId && centerId && centerId !== seniorCenter) eventId = ''
        centerId = seniorCenter
      }
    } catch {
      seniorId = ''
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p>
        <Link href="/staff/tickets">← Tickets</Link>
      </p>
      <h1>New ticket</h1>
      {isStaff(auth.user) && !lockCenterId ? (
        <p className="text-muted-foreground">Your account is not assigned to a center yet.</p>
      ) : !lockCenterId && centers.length === 0 ? (
        <p className="text-muted-foreground">
          <Link href="/staff/centers/new">Add a center</Link> before creating tickets.
        </p>
      ) : (
        <TicketForm
          centers={centers}
          seniors={seniors}
          events={events}
          students={students}
          lockCenterId={lockCenterId}
          centerLabel={centers.find((center) => center.id === lockCenterId)?.label}
          defaults={{ centerId, eventId, seniorId, status: 'open' }}
          submitLabel="Save ticket"
        />
      )}
    </section>
  )
}
