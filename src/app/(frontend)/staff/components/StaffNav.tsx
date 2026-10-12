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
    <nav className="flex flex-wrap gap-1.5" aria-label="Staff">
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
              'rounded-full px-3 py-1.5 text-sm transition-colors',
              current
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
