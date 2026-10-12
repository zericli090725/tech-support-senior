import Link from 'next/link'

import { isAdminUser, isStudent } from '@/access/roles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getAuth } from '@/lib/auth'

const steps = [
  {
    title: 'Join a center',
    body: 'Request a spot at a senior center. Staff there approve you before you take on work.',
  },
  {
    title: 'Show up',
    body: 'Claim an appointment or RSVP to a group help day once you are approved.',
  },
  {
    title: 'Log your hours',
    body: 'Keep a simple record of the time you spent helping.',
  },
]

export default async function HomePage() {
  const { user } = await getAuth()
  const student = isStudent(user)
  const staff = isAdminUser(user)

  return (
    <div className="flex flex-col gap-16">
      <section className="flex max-w-2xl flex-col gap-6 pt-6">
        <p className="text-sm font-semibold text-primary">Volunteer tech help</p>
        <h1 className="text-[2.7rem] leading-[1.02] text-balance sm:text-6xl">
          Connect students who like tech with seniors who <em className="text-primary italic">need a hand.</em>
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Center staff open tickets and host group help days. Students join a center, claim
          appointments, RSVP to events, and log volunteer hours.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {staff ? (
            <Button asChild size="lg">
              <Link href="/staff">Go to the staff dashboard</Link>
            </Button>
          ) : student ? (
            <Button asChild size="lg">
              <Link href="/dashboard">Go to your dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/register">Register as a student</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Student login</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/staff/login">Center staff login</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {!student && !staff ? (
        <section className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} size="sm">
              <CardHeader>
                <p className="text-xs font-medium tracking-wide text-muted-foreground">
                  0{index + 1}
                </p>
                <h2 className="text-2xl">{step.title}</h2>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  )
}
