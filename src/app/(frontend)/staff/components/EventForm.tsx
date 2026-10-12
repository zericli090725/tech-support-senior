'use client'

import { useActionState, useEffect, useState } from 'react'

import { saveEvent } from '@/app/(frontend)/actions/staff'
import { stampLocalDateTimes, toDateTimeLocal } from '@/app/(frontend)/staff/components/dates'
import { SelectField, TextareaField, TextField } from '@/app/(frontend)/staff/components/fields'
import type { Choice } from '@/app/(frontend)/staff/options'
import { Button } from '@/components/ui/button'
import type { ActionState } from '@/lib/errors'

type Defaults = {
  id?: string
  title?: string
  centerId?: string
  startsAt?: string | null
  endsAt?: string | null
  locationInCenter?: string | null
  maxStudents?: number | null
  description?: string | null
}

type Props = {
  centers: Choice[]
  lockCenterId?: string
  centerLabel?: string
  defaults?: Defaults
  submitLabel: string
}

export function EventForm({ centers, lockCenterId, centerLabel, defaults, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      stampLocalDateTimes(formData, ['startsAt', 'endsAt'])
      return saveEvent(prev, formData)
    },
    null,
  )
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [ready, setReady] = useState(!defaults?.startsAt && !defaults?.endsAt)

  useEffect(() => {
    if (defaults?.startsAt) setStartsAt(toDateTimeLocal(defaults.startsAt))
    if (defaults?.endsAt) setEndsAt(toDateTimeLocal(defaults.endsAt))
    setReady(true)
  }, [defaults?.startsAt, defaults?.endsAt])

  return (
    <form className="flex flex-col gap-4" action={formAction}>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <TextField label="Title" name="title" required defaultValue={defaults?.title || ''} />
      {lockCenterId ? (
        <>
          <input type="hidden" name="center" value={lockCenterId} />
          <p className="text-muted-foreground">Center: {centerLabel || 'Your center'}</p>
        </>
      ) : (
        <SelectField label="Center" name="center" required defaultValue={defaults?.centerId || ''}>
          <option value="">Choose a center</option>
          {centers.map((center) => (
            <option key={center.id} value={center.id}>
              {center.label}
            </option>
          ))}
        </SelectField>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Starts"
          name="startsAt"
          type="datetime-local"
          required
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
        />
        <TextField
          label="Ends"
          name="endsAt"
          type="datetime-local"
          value={endsAt}
          onChange={(event) => setEndsAt(event.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Room or area"
          name="locationInCenter"
          defaultValue={defaults?.locationInCenter || ''}
          placeholder="Community Room"
        />
        <TextField
          label="Student cap"
          name="maxStudents"
          type="number"
          min={1}
          step={1}
          defaultValue={defaults?.maxStudents ?? ''}
          placeholder="Optional"
        />
      </div>
      <TextareaField label="Description" name="description" rows={4} defaultValue={defaults?.description || ''} />
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending || !ready}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
