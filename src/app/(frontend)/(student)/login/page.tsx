import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/app/(frontend)/components/LoginForm'
import { isAdminUser, isStudent } from '@/access/roles'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { getAuth } from '@/lib/auth'

export default async function LoginPage() {
  const { user } = await getAuth()
  if (isStudent(user)) redirect('/dashboard')
  if (isAdminUser(user)) redirect('/staff')

  return (
    <div className="mx-auto w-full max-w-md pt-4">
      <Card>
        <CardHeader>
          <h1 className="text-4xl">Student login</h1>
          <CardDescription className="leading-relaxed">
            Use the account you registered on this app. Center staff should{' '}
            <Link href="/staff/login" className="text-foreground underline underline-offset-4">
              use the staff login
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <LoginForm />
          <p className="text-sm text-muted-foreground">
            New here?{' '}
            <Link href="/register" className="text-foreground underline underline-offset-4">
              Create a student account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
