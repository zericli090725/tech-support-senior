import Link from 'next/link'

import { logoutAction } from '@/app/(frontend)/actions/auth'
import { StudentNav } from '@/app/(frontend)/components/StudentNav'
import { isAdminUser, isStudent, type AccessUser } from '@/access/roles'
import { Button } from '@/components/ui/button'

type Props = {
  user: AccessUser | null
}

export function Header({ user }: Props) {
  const student = isStudent(user)
  const staff = isAdminUser(user)
  const home = student ? '/dashboard' : staff ? '/staff' : '/'

  return (
    <header className="sticky top-3 z-40 px-4">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-3xl border border-border/80 bg-card/80 px-3 py-2 shadow-sm backdrop-blur-md">
        <Link
          href={home}
          className="inline-flex items-center gap-2.5 px-2 font-heading text-lg tracking-tight text-foreground"
        >
          <span className="size-2.5 rounded-full bg-primary shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_18%,transparent)]" aria-hidden />
          Senior Tech Support
        </Link>
        {student ? (
          <div className="flex flex-wrap items-center gap-2">
            <StudentNav
              items={[
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/centers', label: 'Centers' },
                { href: '/tickets', label: 'Tickets' },
                { href: '/events', label: 'Events' },
                { href: '/profile', label: 'Hours' },
              ]}
            />
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        ) : staff ? (
          <div className="flex flex-wrap items-center gap-2">
            <StudentNav items={[{ href: '/staff', label: 'Staff dashboard', exact: true }]} />
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        ) : (
          <StudentNav
            items={[
              { href: '/login', label: 'Student login' },
              { href: '/register', label: 'Register' },
              { href: '/staff/login', label: 'Staff login' },
            ]}
          />
        )}
      </div>
    </header>
  )
}
