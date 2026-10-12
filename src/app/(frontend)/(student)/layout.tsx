import { Header } from '@/app/(frontend)/components/Header'
import { getAuth } from '@/lib/auth'

export default async function StudentLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const { user } = await getAuth()

  return (
    <div className="app-shell">
      <Header user={user} />
      <main className="mx-auto w-full max-w-5xl px-6 pt-10 pb-24">{children}</main>
    </div>
  )
}
