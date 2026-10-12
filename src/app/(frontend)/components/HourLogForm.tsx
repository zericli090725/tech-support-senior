'use client'

import { useActionState } from 'react'

import { logHours } from '@/app/(frontend)/actions/hours'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import type { ActionState } from '@/lib/errors'

type Option = {
  id: string
  label: string
}

type Props = {
  tickets: Option[]
  events: Option[]
}

export function HourLogForm({ tickets, events }: Props) {
  const [state, formAction, pending] = useActionState(
    logHours as (state: ActionState, formData: FormData) => Promise<ActionState>,
    null,
  )

  const now = new Date()
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)

  return (
    <form className="flex flex-col gap-4" action={formAction}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="hours">Hours</Label>
          <Input
            id="hours"
            name="hours"
            type="number"
            min={0.25}
            max={24}
            step={0.25}
            required
            defaultValue="1"
            className="h-10"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" required defaultValue={today} className="h-10" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ticket">Linked ticket (optional)</Label>
        <NativeSelect id="ticket" name="ticket" defaultValue="">
          <option value="">None</option>
          {tickets.map((ticket) => (
            <option key={ticket.id} value={ticket.id}>
              {ticket.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="event">Linked event (optional)</Label>
        <NativeSelect id="event" name="event" defaultValue="">
          <option value="">None</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="What did you help with?" />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button className="h-10" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Log hours'}
      </Button>
    </form>
  )
}
