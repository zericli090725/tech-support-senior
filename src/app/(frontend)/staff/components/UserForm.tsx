'use client'

import { useActionState, useState } from 'react'

import { saveStaffUser } from '@/app/(frontend)/actions/staff'
import { SelectField, TextField } from '@/app/(frontend)/staff/components/fields'
import type { Choice } from '@/app/(frontend)/staff/options'
import { Button } from '@/components/ui/button'
import type { ActionState } from '@/lib/errors'

type Props = {
  centers: Choice[]
  requirePassword?: boolean
  defaults?: {
    id?: string
    name?: string
    email?: string
    role?: string
    centerId?: string
  }
  submitLabel: string
}

export function UserForm({ centers, requirePassword, defaults, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(
    saveStaffUser as (state: ActionState, formData: FormData) => Promise<ActionState>,
    null,
  )
  const [role, setRole] = useState(defaults?.role === 'super-admin' ? 'super-admin' : 'staff')

  return (
    <form className="flex flex-col gap-4" action={formAction}>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <TextField label="Name" name="name" required defaultValue={defaults?.name || ''} autoComplete="name" />
      <TextField
        label="Email"
        name="email"
        type="email"
        required
        defaultValue={defaults?.email || ''}
        autoComplete="email"
      />
      <SelectField label="Role" name="role" value={role} onChange={(event) => setRole(event.target.value)}>
        <option value="staff">Center staff</option>
        <option value="super-admin">Super admin</option>
      </SelectField>
      {role === 'staff' ? (
        <SelectField label="Center" name="center" required defaultValue={defaults?.centerId || ''}>
          <option value="">Choose a center</option>
          {centers.map((center) => (
            <option key={center.id} value={center.id}>
              {center.label}
            </option>
          ))}
        </SelectField>
      ) : (
        <p className="text-muted-foreground">Super admins can work across every center.</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required={requirePassword}
          minLength={requirePassword ? 3 : undefined}
        />
        <TextField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required={requirePassword}
        />
      </div>
      {requirePassword ? null : (
        <p className="text-muted-foreground">Leave the password blank to keep the current one.</p>
      )}
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
