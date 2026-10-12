import { Badge } from '@/components/ui/badge'
import { membershipStatusLabels, ticketStatusLabels } from '@/lib/format'

type Props = {
  status: string
}

const variants = {
  open: 'outline',
  assigned: 'default',
  completed: 'secondary',
  cancelled: 'outline',
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  going: 'default',
} as const

const labels: Record<string, string> = {
  ...ticketStatusLabels,
  ...membershipStatusLabels,
  going: 'Going',
}

export function StatusBadge({ status }: Props) {
  const label = labels[status] || status.replace(/-/g, ' ')
  return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{label}</Badge>
}
