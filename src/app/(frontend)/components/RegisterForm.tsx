'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const password = formData.get('password')

    if (password !== formData.get('confirmPassword')) {
      setError('Passwords do not match.')
      return
    }

    setPending(true)
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      password,
    }

    try {
      const registerResponse = await fetch('/api/students', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!registerResponse.ok) {
        const body = (await registerResponse.json().catch(() => null)) as
          | { errors?: { message?: string }[] }
          | null
        setError(body?.errors?.[0]?.message || 'Could not create your account.')
        setPending(false)
        return
      }

      const loginResponse = await fetch('/api/students/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
        }),
      })

      if (!loginResponse.ok) {
        window.location.href = '/login'
        return
      }

      window.location.href = '/dashboard'
    } catch {
      setError('Could not create your account. Try again.')
      setPending(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" type="text" autoComplete="name" required className="h-10" />
      </div>
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
          autoComplete="new-password"
          required
          minLength={3}
          className="h-10"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={3}
          className="h-10"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="h-10 w-full" type="submit" disabled={pending}>
        {pending ? 'Creating account…' : 'Create student account'}
      </Button>
    </form>
  )
}
