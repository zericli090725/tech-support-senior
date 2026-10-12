import Link from 'next/link'

import { getStaffCenterID } from '@/access/getStaffCenterID'
import { isStaff } from '@/access/roles'
import { EventForm } from '@/app/(frontend)/staff/components/EventForm'
import { centerChoices } from '@/app/(frontend)/staff/options'
import { requireStaff } from '@/lib/auth'

export default async function NewEventPage() {
  const auth = await requireStaff()
  const centers = await centerChoices(auth)
  const lockCenterId = getStaffCenterID(auth.user)

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p>
        <Link href="/staff/events">← Events</Link>
      </p>
      <h1>New event</h1>
      {isStaff(auth.user) && !lockCenterId ? (
        <p className="text-muted-foreground">Your account is not assigned to a center yet.</p>
      ) : !lockCenterId && centers.length === 0 ? (
        <p className="text-muted-foreground">
          <Link href="/staff/centers/new">Add a center</Link> before creating events.
        </p>
      ) : (
        <EventForm
          centers={centers}
          lockCenterId={lockCenterId}
          centerLabel={centers.find((center) => center.id === lockCenterId)?.label}
          defaults={{ centerId: lockCenterId }}
          submitLabel="Save event"
        />
      )}
    </section>
  )
}
