import Link from 'next/link'
import { AuthPanel } from '@/app/(frontend)/components/AuthPanel'
import { redirect } from 'next/navigation'

import { RegisterForm } from '@/app/(frontend)/components/RegisterForm'
import { isAdminUser, isStudent } from '@/access/roles'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { getAuth } from '@/lib/auth'

export default async function RegisterPage() {
  const { user } = await getAuth()
  if (isStudent(user)) redirect('/dashboard')
  if (isAdminUser(user)) redirect('/staff')

  return (
    <div className="mx-auto grid w-full max-w-5xl items-stretch gap-6 pt-4 md:grid-cols-2">
      <AuthPanel
          label="Join the community"
          title="Your skills can make someone smile."
          description="A little patience and a bit of tech know-how can make a big difference close to home."
        />
      <Card className="justify-center">
        <CardHeader>
          <h1 className="text-4xl">Create a student account</h1>
          <CardDescription className="leading-relaxed">
            After you register, request to join a senior center. Staff at that center will approve
            you before you can claim tickets or RSVP to events.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <RegisterForm />
          <p className="text-sm text-muted-foreground">
            Already registered?{' '}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
