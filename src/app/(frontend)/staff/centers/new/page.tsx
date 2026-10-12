import Link from 'next/link'

import { saveCenter } from '@/app/(frontend)/actions/staff'
import { TextareaField, TextField } from '@/app/(frontend)/staff/components/fields'
import { StaffForm } from '@/app/(frontend)/staff/components/StaffForm'
import { requireSuperAdmin } from '@/lib/auth'

export default async function NewCenterPage() {
  await requireSuperAdmin()

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p>
        <Link href="/staff/centers">← Centers</Link>
      </p>
      <h1>New center</h1>
      <StaffForm action={saveCenter} submitLabel="Create center">
        <TextField label="Name" name="name" required />
        <TextField label="Address" name="address" />
        <TextareaField label="Internal notes" name="notes" rows={4} placeholder="Parking, front desk, rooms…" />
      </StaffForm>
    </section>
  )
}
