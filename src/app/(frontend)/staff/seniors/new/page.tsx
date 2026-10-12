import Link from 'next/link'

import { getStaffCenterID } from '@/access/getStaffCenterID'
import { isStaff } from '@/access/roles'
import { SeniorForm } from '@/app/(frontend)/staff/components/SeniorForm'
import { centerChoices } from '@/app/(frontend)/staff/options'
import { readParam } from '@/app/(frontend)/staff/queries'
import { requireStaff } from '@/lib/auth'

type Props = {
  searchParams: Promise<{ center?: string }>
}

export default async function NewSeniorPage({ searchParams }: Props) {
  const auth = await requireStaff()
  const params = await searchParams
  const centers = await centerChoices(auth)
  const lockCenterId = getStaffCenterID(auth.user)
  const requestedCenter = readParam(params.center)
  const centerId =
    lockCenterId || (centers.some((center) => center.id === requestedCenter) ? requestedCenter : '')

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p>
        <Link href="/staff/seniors">← Seniors</Link>
      </p>
      <h1>New senior</h1>
      {isStaff(auth.user) && !lockCenterId ? (
        <p className="text-muted-foreground">Your account is not assigned to a center yet.</p>
      ) : !lockCenterId && centers.length === 0 ? (
        <p className="text-muted-foreground">
          <Link href="/staff/centers/new">Add a center</Link> before adding seniors.
        </p>
      ) : (
        <SeniorForm
          centers={centers}
          lockCenterId={lockCenterId}
          centerLabel={centers.find((center) => center.id === lockCenterId)?.label}
          defaults={{ centerId, contactMethod: 'center' }}
          submitLabel="Create senior"
        />
      )}
    </section>
  )
}
