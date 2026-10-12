'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from 'cn'
import type { ActionState } from '@/lib/errors'

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  children: React.ReactNode
  submitLabel: string
  className?: string
}

export function StaffForm({ action, children, submitLabel, className }: Props) {
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form className={cn('flex flex-col gap-4', className)} action={formAction}>
      {children}
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
