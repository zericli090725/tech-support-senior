import Link from 'next/link'

import { ActionButton } from '@/app/(frontend)/components/ActionButton'
import { PageIntro } from '@/app/(frontend)/components/PageIntro'
import { StudentStatus } from '@/app/(frontend)/components/StudentStatus'
import { claimTicket } from '@/app/(frontend)/actions/tickets'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { requireStudent } from '@/lib/auth'
import { deviceLabels, formatDateTime, getDocName } from '@/lib/format'
import type { Ticket } from '@/payload-types'

export default async function TicketsPage() {
  const { user, payload } = await requireStudent()

  const tickets = await payload.find({
    collection: 'tickets',
    where: { status: { equals: 'open' } },
    sort: 'scheduledAt',
    depth: 1,
    limit: 50,
    user,
    overrideAccess: false,
  })

  return (
    <div className="flex flex-col gap-10">
      <PageIntro
        title="Open tickets"
        description="These appointments are at centers where you are approved. Claim one to take it on."
      />
      {tickets.docs.length === 0 ? (
        <p className="max-w-xl leading-relaxed text-muted-foreground">
          No open tickets right now. Join a center and wait for approval, or check back later.
        </p>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))]">
          {tickets.docs.map((ticket: Ticket) => (
            <Card as="article" className="h-full" key={ticket.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl">{ticket.seniorName}</h2>
                  <StudentStatus status={ticket.status} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="leading-relaxed">{ticket.issue}</p>
                <p className="text-sm text-muted-foreground">
                  {getDocName(ticket.center)}
                  {ticket.device ? ` · ${deviceLabels[ticket.device] || ticket.device}` : ''}
                  {ticket.scheduledAt ? ` · ${formatDateTime(ticket.scheduledAt)}` : ''}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-3">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/tickets/${ticket.id}`}>Details</Link>
                  </Button>
                  <ActionButton
                    action={claimTicket}
                    hiddenFields={{ ticketId: String(ticket.id) }}
                    label="Claim"
                    pendingLabel="Claiming…"
                    variant="default"
                    size="sm"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
