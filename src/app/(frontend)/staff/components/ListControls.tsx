import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { SelectField, TextField } from '@/app/(frontend)/staff/components/fields'
import type { Choice } from '@/app/(frontend)/staff/options'
import { cn } from 'cn'

export function ListFilters({
  query,
  placeholder,
  center,
  centers,
  preserve,
}: {
  query?: string
  placeholder?: string
  center?: string
  centers?: Choice[]
  preserve?: Record<string, string | undefined>
}) {
  if (!placeholder && !centers) return null

  return (
    <form className="flex flex-wrap items-end gap-3" method="get">
      {placeholder ? (
        <div className="min-w-56 flex-1">
          <TextField label="Search" name="q" defaultValue={query || ''} placeholder={placeholder} />
        </div>
      ) : null}
      {centers ? (
        <div className="min-w-48">
          <SelectField label="Center" name="center" defaultValue={center || ''}>
            <option value="">All centers</option>
            {centers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </SelectField>
        </div>
      ) : null}
      {Object.entries(preserve || {}).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <Button type="submit">{placeholder ? 'Search' : 'Apply'}</Button>
    </form>
  )
}

export function FilterPills({
  path,
  param,
  value,
  options,
  extra,
}: {
  path: string
  param: string
  value?: string
  options: { value: string; label: string }[]
  extra?: Record<string, string | undefined>
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const search = new URLSearchParams()
        for (const [key, item] of Object.entries(extra || {})) {
          if (item) search.set(key, item)
        }
        if (option.value) search.set(param, option.value)
        const qs = search.toString()
        const current = (value || '') === option.value
        return (
          <Link
            key={option.value || 'all'}
            href={qs ? `${path}?${qs}` : path}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm',
              current
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent',
            )}
          >
            {option.label}
          </Link>
        )
      })}
    </div>
  )
}

export function Pager({
  page,
  totalPages,
  path,
  params,
}: {
  page: number
  totalPages: number
  path: string
  params?: Record<string, string | undefined>
}) {
  if (totalPages <= 1) return null

  const href = (nextPage: number) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params || {})) {
      if (value) search.set(key, value)
    }
    if (nextPage > 1) search.set('page', String(nextPage))
    const qs = search.toString()
    return qs ? `${path}?${qs}` : path
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {page > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={href(page - 1)}>Previous</Link>
        </Button>
      ) : null}
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Button asChild variant="outline" size="sm">
          <Link href={href(page + 1)}>Next</Link>
        </Button>
      ) : null}
    </div>
  )
}
