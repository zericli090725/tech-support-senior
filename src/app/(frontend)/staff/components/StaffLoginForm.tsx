'use client'

import { useState } from 'react'

import { TextField } from '@/app/(frontend)/staff/components/fields'
import { Button } from '@/components/ui/button'

export function StaffLoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { errors?: { message?: string }[] }
          | null
        setError(body?.errors?.[0]?.message || 'Invalid email or password.')
        setPending(false)
        return
      }

      window.location.href = '/staff'
    } catch {
      setError('Could not log in. Try again.')
      setPending(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <TextField label="Email" name="email" type="email" autoComplete="username" required />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Log in'}
      </Button>
    </form>
  )
}
