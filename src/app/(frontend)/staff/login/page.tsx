import Link from 'next/link'
import { AuthPanel } from '@/app/(frontend)/components/AuthPanel'
import { redirect } from 'next/navigation'

import { isAdminUser, isStudent } from '@/access/roles'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { getAuth } from '@/lib/auth'

import { StaffLoginForm } from '../components/StaffLoginForm'

export default async function StaffLoginPage() {
  const { user } = await getAuth()
  if (isAdminUser(user)) redirect('/staff')
  if (isStudent(user)) redirect('/dashboard')

  return (
    <div className="mx-auto grid w-full max-w-5xl items-stretch gap-6 pt-4 md:grid-cols-2">
      <AuthPanel
          label="For center staff"
          title="The little things add up."
          description="Coordinate volunteers and give every neighbor the support they deserve."
        />
      <Card className="justify-center">
        <CardHeader>
          <h1 className="text-4xl">Staff login</h1>
          <CardDescription className="leading-relaxed">
            Sign in to manage centers, tickets, events, volunteers, and hours. Students should{' '}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              use the student login
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffLoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
