import Link from 'next/link'
import { notFound } from 'next/navigation'

import { deleteStaffUser } from '@/app/(frontend)/actions/staff'
import { ConfirmButton } from '@/app/(frontend)/staff/components/ConfirmButton'
import { UserForm } from '@/app/(frontend)/staff/components/UserForm'
import { centerChoices } from '@/app/(frontend)/staff/options'
import { requireSuperAdmin } from '@/lib/auth'
import { getRelationID } from '@/lib/getRelationID'

type Props = {
  params: Promise<{ id: string }>
}

export default async function StaffUserPage({ params }: Props) {
  const { id } = await params
  const auth = await requireSuperAdmin()
  const { user, payload } = auth

  let member
  try {
    member = await payload.findByID({
      collection: 'users',
      id,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  const centers = await centerChoices(auth)
  const isSelf = String(member.id) === user.id

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p>
        <Link href="/staff/team">← Team</Link>
      </p>
      <h1>{member.name}</h1>
      <UserForm
        centers={centers}
        defaults={{
          id: String(member.id),
          name: member.name,
          email: member.email,
          role: member.role,
          centerId: getRelationID(member.center),
        }}
        submitLabel="Save staff user"
      />
      {isSelf ? (
        <p className="text-muted-foreground">You cannot delete your own account.</p>
      ) : (
        <ConfirmButton
          action={deleteStaffUser}
          hiddenFields={{ id: String(member.id) }}
          label="Delete staff user"
          confirmMessage={`Delete ${member.name}'s staff account?`}
        />
      )}
    </section>
  )
}
