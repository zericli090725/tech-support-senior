'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from 'cn'

type Item = {
  href: string
  label: string
  exact?: boolean
}

export function StudentNav({ items }: { items: Item[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-full bg-secondary/80 p-1">
      {items.map((item) => {
        const active =
          item.exact || item.href === '/'
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm transition-colors',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
