import { ActionButton } from '@/app/(frontend)/components/ActionButton'
import { PageIntro } from '@/app/(frontend)/components/PageIntro'
import { StudentStatus } from '@/app/(frontend)/components/StudentStatus'
import { joinCenter } from '@/app/(frontend)/actions/memberships'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { requireStudent } from '@/lib/auth'
import { getRelationID } from '@/lib/getRelationID'
import type { Center, CenterMembership } from '@/payload-types'

export default async function CentersPage() {
  const { user, payload } = await requireStudent()

  const [centers, memberships] = await Promise.all([
    payload.find({
      collection: 'centers',
      sort: 'name',
      limit: 100,
      depth: 0,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'center-memberships',
      where: { student: { equals: user.id } },
      limit: 100,
      depth: 0,
      user,
      overrideAccess: false,
    }),
  ])

  const membershipByCenter = new Map<string, CenterMembership>()
  for (const membership of memberships.docs) {
    const centerID = getRelationID(membership.center)
    if (centerID) membershipByCenter.set(centerID, membership)
  }

  return (
    <div className="flex flex-col gap-10">
      <PageIntro
        title="Centers"
        description="Request to join a center. Staff there will approve you before you can take work."
      />
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))]">
        {centers.docs.map((center: Center) => {
          const membership = membershipByCenter.get(String(center.id))
          return (
            <Card as="article" className="h-full" key={center.id}>
              <CardHeader>
                <h2 className="text-2xl">{center.name}</h2>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                {center.address ? <p className="leading-relaxed text-muted-foreground">{center.address}</p> : null}
                <div className="mt-auto">
                  {membership ? (
                    <StudentStatus status={membership.status} />
                  ) : (
                    <ActionButton
                      action={joinCenter}
                      hiddenFields={{ centerId: String(center.id) }}
                      label="Request to join"
                      pendingLabel="Sending…"
                      variant="default"
                      className="h-10"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
