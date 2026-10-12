import { isSuperAdmin } from '@/access/roles'
import { saveOwnAccount } from '@/app/(frontend)/actions/staff'
import { TextField } from '@/app/(frontend)/staff/components/fields'
import { StaffForm } from '@/app/(frontend)/staff/components/StaffForm'
import { requireStaff } from '@/lib/auth'
import { getDocName, roleLabels } from '@/lib/format'
import Link from 'next/link'

export default async function StaffAccountPage() {
  const { user, payload } = await requireStaff()
  const profile = await payload.findByID({
    collection: 'users',
    id: user.id,
    depth: 1,
    user,
    overrideAccess: false,
  })
  const superAdmin = isSuperAdmin(user)

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <h1>Your account</h1>
        <p className="text-muted-foreground">
          {roleLabels[profile.role] || profile.role}
          {profile.center ? ` · ${getDocName(profile.center)}` : ''}
        </p>
      </div>
      <StaffForm action={saveOwnAccount} submitLabel="Save account">
        <TextField label="Name" name="name" required defaultValue={profile.name} autoComplete="name" />
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          defaultValue={profile.email}
          autoComplete="email"
        />
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
      {superAdmin ? (
        <p className="text-muted-foreground">
          Change your role from the <Link href={`/staff/team/${profile.id}`}>team page</Link>.
        </p>
      ) : (
        <p className="text-muted-foreground">A super admin assigns your role and center.</p>
      )}
    </section>
  )
}
