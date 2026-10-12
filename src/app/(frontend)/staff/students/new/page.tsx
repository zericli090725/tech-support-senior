import Link from 'next/link'

import { saveStudent } from '@/app/(frontend)/actions/staff'
import { TextField } from '@/app/(frontend)/staff/components/fields'
import { StaffForm } from '@/app/(frontend)/staff/components/StaffForm'
import { requireSuperAdmin } from '@/lib/auth'

export default async function NewStudentPage() {
  await requireSuperAdmin()

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p>
        <Link href="/staff/students">← Students</Link>
      </p>
      <h1>New student</h1>
      <p className="text-muted-foreground">Students sign in on the public site. They cannot open this dashboard.</p>
      <StaffForm action={saveStudent} submitLabel="Create student">
        <TextField label="Name" name="name" required autoComplete="name" />
        <TextField label="Email" name="email" type="email" required autoComplete="email" />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Password"
            name="password"
            type="password"
            required
            minLength={3}
            autoComplete="new-password"
          />
          <TextField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
          />
        </div>
      </StaffForm>
    </section>
  )
}
