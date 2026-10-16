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
    <nav className="flex flex-wrap items-center gap-1" aria-label="Student navigation">
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
              'rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
              active
                ? 'bg-[#fbe8e1] text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
