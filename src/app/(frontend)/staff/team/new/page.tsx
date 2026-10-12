import Link from 'next/link'

import { UserForm } from '@/app/(frontend)/staff/components/UserForm'
import { centerChoices } from '@/app/(frontend)/staff/options'
import { requireSuperAdmin } from '@/lib/auth'

export default async function NewStaffUserPage() {
  const auth = await requireSuperAdmin()
  const centers = await centerChoices(auth)

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p>
        <Link href="/staff/team">← Team</Link>
      </p>
      <h1>New staff user</h1>
      <UserForm centers={centers} requirePassword submitLabel="Create staff user" />
    </section>
  )
}
