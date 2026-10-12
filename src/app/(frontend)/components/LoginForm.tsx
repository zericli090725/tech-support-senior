'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/students/login', {
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

      window.location.href = '/dashboard'
    } catch {
      setError('Could not log in. Try again.')
      setPending(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-10" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-10"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="h-10 w-full" type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Log in'}
      </Button>
    </form>
  )
}
