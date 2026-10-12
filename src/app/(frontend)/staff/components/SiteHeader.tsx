import Link from 'next/link'

import { logoutAction } from '@/app/(frontend)/actions/auth'
import { isAdminUser, isStudent, type AccessUser } from '@/access/roles'

type Props = {
  user: AccessUser | null
}

export function SiteHeader({ user }: Props) {
  const student = isStudent(user)
  const staff = isAdminUser(user)

  return (
    <header className="site-header">
      <Link className="brand" href={student ? '/dashboard' : staff ? '/staff' : '/'}>
        Senior Tech Support
      </Link>
      <nav className="nav">
        {student ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/centers">Centers</Link>
            <Link href="/tickets">Tickets</Link>
            <Link href="/events">Events</Link>
            <Link href="/profile">Hours</Link>
            <form action={logoutAction}>
              <button className="btn btn-ghost" type="submit">
                Log out
              </button>
            </form>
          </>
        ) : staff ? (
          <>
            <Link href="/staff">Staff dashboard</Link>
            <form action={logoutAction}>
              <button className="btn btn-ghost" type="submit">
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Student login</Link>
            <Link href="/register">Register</Link>
            <Link href="/staff/login">Staff login</Link>
          </>
        )}
      </nav>
    </header>
  )
}
