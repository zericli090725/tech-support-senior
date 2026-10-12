import { StatusBadge } from '@/app/(frontend)/components/StatusBadge'

type Props = {
  status: string
}

export function StudentStatus({ status }: Props) {
  return <StatusBadge status={status} />
}
