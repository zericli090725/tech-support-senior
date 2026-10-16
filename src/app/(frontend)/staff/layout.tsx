import { isAdminUser, isSuperAdmin } from '@/access/roles'
import { Header } from '@/app/(frontend)/components/Header'
import { getAuth } from '@/lib/auth'

import { StaffNav } from './components/StaffNav'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAuth()
  const staff = isAdminUser(user)

  return (
    <div className="app-shell">
      <Header user={user} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 pt-10 pb-24 sm:px-8">
        {staff ? <StaffNav superAdmin={isSuperAdmin(user)} /> : null}
        {children}
      </main>
    </div>
  )
}
