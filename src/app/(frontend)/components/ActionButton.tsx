'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import type { ActionState } from '@/lib/errors'

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  hiddenFields?: Record<string, string>
  label: string
  pendingLabel?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
}

export function ActionButton({
  action,
  hiddenFields,
  label,
  pendingLabel = 'Working…',
  className,
  variant,
  size,
}: Props) {
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction}>
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      <Button className={className} variant={variant || 'default'} size={size} type="submit" disabled={pending}>
        {pending ? pendingLabel : label}
      </Button>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  )
}
