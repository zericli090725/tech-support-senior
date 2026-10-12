'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import type { ActionState } from '@/lib/errors'

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  hiddenFields?: Record<string, string>
  label: string
  confirmMessage: string
  pendingLabel?: string
}

export function ConfirmButton({
  action,
  hiddenFields,
  label,
  confirmMessage,
  pendingLabel = 'Removing…',
}: Props) {
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form
      className="flex flex-col items-start gap-2"
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault()
      }}
    >
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      <Button variant="outline" type="submit" disabled={pending}>
        {pending ? pendingLabel : label}
      </Button>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  )
}
