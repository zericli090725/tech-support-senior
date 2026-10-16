import { HeartHandshake, Sparkles } from 'lucide-react'

type Props = {
  label: string
  title: string
  description: string
}

export function AuthPanel({ label, title, description }: Props) {
  return (
    <aside className="relative flex min-h-[18rem] flex-col justify-between overflow-hidden rounded-[2.25rem] bg-[#23584f] p-7 text-white sm:min-h-[27rem] sm:p-10">
      <div
        className="absolute -right-14 -top-14 size-64 rounded-full border-[2.5rem] border-white/10"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -left-16 size-72 rounded-full bg-[#347c6d]/70 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.12em] text-[#d6f0e7] uppercase">
        <Sparkles className="size-4" aria-hidden="true" /> {label}
      </div>
      <div className="relative max-w-md">
        <span className="mb-4 hidden size-14 place-items-center rounded-2xl bg-white/15 sm:grid">
          <HeartHandshake className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mb-2 !text-[clamp(2rem,4vw,3.4rem)] !leading-[1.05] text-white sm:mb-4">
          {title}
        </h2>
        <p className="text-base leading-relaxed text-[#e0f1e9] sm:text-lg">
          {description}
        </p>
      </div>
    </aside>
  )
}
