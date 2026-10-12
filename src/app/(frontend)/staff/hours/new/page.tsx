import Link from 'next/link'

import { HourLogAdminForm } from '@/app/(frontend)/staff/components/HourLogAdminForm'
import { hourLogChoices } from '@/app/(frontend)/staff/options'
import { readParam } from '@/app/(frontend)/staff/queries'
import { requireSuperAdmin } from '@/lib/auth'

type Props = {
  searchParams: Promise<{ student?: string }>
}

export default async function NewHourLogPage({ searchParams }: Props) {
  const auth = await requireSuperAdmin()
  const params = await searchParams
  const choices = await hourLogChoices(auth)
  const studentId = readParam(params.student)
  const known = choices.students.some((student) => student.id === studentId)

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <p>
        <Link href="/staff/hours">← Hours</Link>
      </p>
      <h1>Log hours</h1>
      <HourLogAdminForm
        students={choices.students}
        tickets={choices.tickets}
        events={choices.events}
        defaults={{ studentId: known ? studentId : '' }}
        submitLabel="Save hours"
      />
    </section>
  )
}
