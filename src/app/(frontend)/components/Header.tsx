import Link from 'next/link'
import { HeartHandshake } from 'lucide-react'

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
    <header className="relative z-40 px-4 pt-4 sm:px-8 sm:pt-6">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 rounded-[1.65rem] border border-white/80 bg-white/85 px-4 py-3 shadow-[0_12px_36px_rgb(49_72_61_/_7%)] backdrop-blur-md sm:px-6">
        <Link href={home} className="inline-flex items-center gap-2.5 font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f7dfd4] text-primary" aria-hidden="true">
            <HeartHandshake className="size-5" strokeWidth={2} />
          </span>
          <span>Senior Tech Support</span>
        </Link>
        {student ? (
          <div className="flex flex-wrap items-center gap-3">
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
              <Button type="submit" variant="outline" size="sm">Log out</Button>
            </form>
          </div>
        ) : staff ? (
          <div className="flex flex-wrap items-center gap-3">
            <StudentNav items={[{ href: '/staff', label: 'Staff dashboard', exact: true }]} />
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">Log out</Button>
            </form>
          </div>
        ) : (
          <nav className="flex flex-wrap items-center gap-1.5 sm:gap-3" aria-label="Main navigation">
            <Link href="/login" className="rounded-full px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"><span className="sm:hidden">Student</span><span className="hidden sm:inline">Student login</span></Link>
            <Link href="/staff/login" className="rounded-full px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"><span className="sm:hidden">Staff</span><span className="hidden sm:inline">Center staff</span></Link>
            <Button asChild size="sm" className="ml-1"><Link href="/register"><span className="sm:hidden">Join</span><span className="hidden sm:inline">Get started</span></Link></Button>
          </nav>
        )}
      </div>
    </header>
  )
}
