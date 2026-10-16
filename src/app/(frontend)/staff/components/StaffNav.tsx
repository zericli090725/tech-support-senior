'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from 'cn'

type Props = {
  superAdmin: boolean
}

export function StaffNav({ superAdmin }: Props) {
  const pathname = usePathname()
  const items = [
    { href: '/staff', label: 'Dashboard' },
    { href: '/staff/tickets', label: 'Tickets' },
    { href: '/staff/seniors', label: 'Seniors' },
    { href: '/staff/events', label: 'Events' },
    { href: '/staff/memberships', label: 'Volunteers' },
    { href: '/staff/students', label: 'Students' },
    { href: '/staff/hours', label: 'Hours' },
    { href: '/staff/centers', label: 'Centers' },
    ...(superAdmin ? [{ href: '/staff/team', label: 'Team' }] : []),
    { href: '/staff/media', label: 'Media' },
    { href: '/staff/account', label: 'Account' },
  ]

  return (
    <nav className="flex flex-wrap gap-1.5 rounded-[1.5rem] border border-border bg-card/75 p-2 shadow-[0_8px_24px_rgb(49_72_61_/_5%)]" aria-label="Staff">
      {items.map((item) => {
        const current =
          item.href === '/staff'
            ? pathname === '/staff'
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
              current
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
