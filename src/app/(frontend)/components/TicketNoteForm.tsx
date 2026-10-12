'use client'

import { useActionState } from 'react'

import { addTicketNote } from '@/app/(frontend)/actions/tickets'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import type { ActionState } from '@/lib/errors'
import { ticketStatusLabels } from '@/lib/format'

type Props = {
  ticketId: string
  status: string
  releaseOnOpen?: boolean
}

export function TicketNoteForm({ ticketId, status, releaseOnOpen }: Props) {
  const [state, formAction, pending] = useActionState(
    addTicketNote as (state: ActionState, formData: FormData) => Promise<ActionState>,
    null,
  )

  return (
    <form className="flex flex-col gap-4" action={formAction}>
      <input type="hidden" name="ticketId" value={ticketId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Note</Label>
        <Textarea id="body" name="body" rows={3} required placeholder="What happened with this ticket?" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note-status">Status</Label>
        <NativeSelect id="note-status" name="status" defaultValue={status}>
          {Object.entries(ticketStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Keep the current status, or change it with this note.
          {releaseOnOpen ? ' Choosing Open lets another student claim this ticket.' : ''}
        </p>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button className="h-10 w-fit" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Add note'}
      </Button>
    </form>
  )
}
