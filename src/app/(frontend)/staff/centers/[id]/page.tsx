import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getStaffCenterID } from '@/access/getStaffCenterID'
import { isSuperAdmin } from '@/access/roles'
import { deleteCenter, saveCenter } from '@/app/(frontend)/actions/staff'
import { ConfirmButton } from '@/app/(frontend)/staff/components/ConfirmButton'
import { TextareaField, TextField } from '@/app/(frontend)/staff/components/fields'
import { StaffForm } from '@/app/(frontend)/staff/components/StaffForm'
import { Button } from '@/components/ui/button'
import { requireStaff } from '@/lib/auth'
import { formatSeniorContact } from '@/lib/format'

type Props = {
  params: Promise<{ id: string }>
}

export default async function StaffCenterPage({ params }: Props) {
  const { id } = await params
  const { user, payload } = await requireStaff()
  const superAdmin = isSuperAdmin(user)

  let center
  try {
    center = await payload.findByID({
      collection: 'centers',
      id,
      depth: 0,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  const showSeniors = superAdmin || getStaffCenterID(user) === String(center.id)
  const seniors = showSeniors
    ? await payload.find({
        collection: 'seniors',
        where: { center: { equals: id } },
        sort: 'lastName',
        depth: 0,
        limit: 12,
        user,
        overrideAccess: false,
      })
    : null

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p>
        <Link href="/staff/centers">← Centers</Link>
      </p>
      <h1>{center.name}</h1>
      {superAdmin ? (
        <>
          <StaffForm action={saveCenter} submitLabel="Save center">
            <input type="hidden" name="id" value={String(center.id)} />
            <TextField label="Name" name="name" required defaultValue={center.name} />
            <TextField label="Address" name="address" defaultValue={center.address || ''} />
            <TextareaField label="Internal notes" name="notes" rows={4} defaultValue={center.notes || ''} />
          </StaffForm>
          <ConfirmButton
            action={deleteCenter}
            hiddenFields={{ id: String(center.id) }}
            label="Delete center"
            confirmMessage={`Delete ${center.name}? This fails if seniors, tickets, events, or staff still use it.`}
          />
        </>
      ) : (
        <dl className="grid gap-4 text-sm [&_dt]:font-medium [&_dt]:text-muted-foreground">
          <div>
            <dt>Address</dt>
            <dd>{center.address || 'Not listed'}</dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd>{center.notes || 'No notes'}</dd>
          </div>
        </dl>
      )}
      {seniors ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2>Seniors</h2>
            <Button asChild variant="secondary">
              <Link href={`/staff/seniors/new?center=${center.id}`}>Add senior</Link>
            </Button>
          </div>
          {seniors.docs.length === 0 ? (
            <p className="text-muted-foreground">No senior profiles yet.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {seniors.docs.map((senior) => (
                <li key={senior.id}>
                  <Link href={`/staff/seniors/${senior.id}`}>{senior.name}</Link>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {formatSeniorContact(senior.contactMethod, senior.contact)}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p>
            <Link href={superAdmin ? `/staff/seniors?center=${center.id}` : '/staff/seniors'}>All seniors</Link>
          </p>
        </div>
      ) : null}
    </section>
  )
}
