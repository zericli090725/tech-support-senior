import { Header } from '@/app/(frontend)/components/Header'
import { getAuth } from '@/lib/auth'

export default async function StudentLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const { user } = await getAuth()

  return (
    <div className="app-shell">
      <Header user={user} />
      <main className="mx-auto w-full max-w-6xl px-5 pt-10 pb-24 sm:px-8">{children}</main>
    </div>
  )
}
