'use client'

import { useActionState, useState } from 'react'

import { saveSenior } from '@/app/(frontend)/actions/staff'
import { SelectField, TextField } from '@/app/(frontend)/staff/components/fields'
import type { Choice } from '@/app/(frontend)/staff/options'
import { Button } from '@/components/ui/button'
import type { ActionState } from '@/lib/errors'
import { contactMethodLabels } from '@/lib/format'

type Defaults = {
  id?: string
  firstName?: string
  lastName?: string
  contactMethod?: string
  contact?: string | null
  centerId?: string
}

type Props = {
  centers: Choice[]
  lockCenterId?: string
  centerLabel?: string
  defaults?: Defaults
  submitLabel: string
}

export function SeniorForm({ centers, lockCenterId, centerLabel, defaults, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(saveSenior, null)
  const [centerId, setCenterId] = useState(lockCenterId || defaults?.centerId || '')
  const [contactMethod, setContactMethod] = useState(defaults?.contactMethod || 'center')

  return (
    <form className="flex flex-col gap-4" action={formAction}>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="First name" name="firstName" required defaultValue={defaults?.firstName || ''} />
        <TextField label="Last name" name="lastName" required defaultValue={defaults?.lastName || ''} />
      </div>
      <SelectField
        label="How to reach them"
        name="contactMethod"
        value={contactMethod}
        onChange={(event) => setContactMethod(event.target.value)}
      >
        {Object.entries(contactMethodLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      {contactMethod === 'center' ? (
        <p className="text-muted-foreground">Staff will reach this senior through the center.</p>
      ) : (
        <TextField
          key={contactMethod}
          label={contactMethod === 'email' ? 'Email' : 'Cell number'}
          name="contact"
          type={contactMethod === 'email' ? 'email' : 'tel'}
          required
          defaultValue={defaults?.contact || ''}
          autoComplete={contactMethod === 'email' ? 'email' : 'tel'}
          placeholder={contactMethod === 'email' ? 'name@example.com' : '619-555-0100'}
        />
      )}
      {lockCenterId ? (
        <>
          <input type="hidden" name="center" value={lockCenterId} />
          <p className="text-muted-foreground">Center: {centerLabel || 'Your center'}</p>
        </>
      ) : (
        <SelectField
          label="Center"
          name="center"
          required
          value={centerId}
          onChange={(event) => setCenterId(event.target.value)}
        >
          <option value="">Choose a center</option>
          {centers.map((center) => (
            <option key={center.id} value={center.id}>
              {center.label}
            </option>
          ))}
        </SelectField>
      )}
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
