import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock3, Heart, MapPin, Sparkles } from 'lucide-react'

import { isAdminUser, isStudent } from '@/access/roles'
import { HeroGallery } from '@/app/(frontend)/components/HeroGallery'
import { Button } from '@/components/ui/button'
import { getAuth } from '@/lib/auth'

const steps = [
  {
    icon: MapPin,
    number: '01',
    title: 'Find your place',
    body: 'Join a local center and become part of the welcoming volunteer team.',
    color: 'bg-[#e7f2ed] text-[#327767]',
  },
  {
    icon: CalendarDays,
    number: '02',
    title: 'Make a difference',
    body: 'Help by accepting an appointment or lending a hand at a group tech day.',
    color: 'bg-[#fff0df] text-[#a76632]',
  },
  {
    icon: Clock3,
    number: '03',
    title: 'See your impact',
    body: 'Keep track of your volunteer hours and see the difference you make.',
    color: 'bg-[#fbe8e1] text-[#b94e39]',
  },
]

export default async function HomePage() {
  const { user } = await getAuth()
  const student = isStudent(user)
  const staff = isAdminUser(user)

  return (
    <div className="flex flex-col gap-20 pb-4 sm:gap-28">
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8 lg:pt-9">
        <div className="relative z-10 flex flex-col items-start gap-7 lg:py-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e7f2ed] px-4 py-2 text-xs font-bold tracking-[0.12em] text-[#2f7769] uppercase">
            <Sparkles className="size-4" aria-hidden="true" /> Tech4Seniors
          </span>
          <h1 className="max-w-2xl text-balance !text-[clamp(3.45rem,6vw,5.75rem)] !leading-[0.98]">
            A little help,<br />A lot of <span className="text-primary">connection.</span>
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Bring your tech know-how to someone who could use a hand. A little tech help goes a long way. Use your skills to help senior citizens feel more confident and connected in an increasingly digital world.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {staff ? (
              <Button asChild size="lg"><Link href="/staff">Go to staff dashboard <ArrowRight className="ml-1 size-4" /></Link></Button>
            ) : student ? (
              <Button asChild size="lg"><Link href="/dashboard">Go to your dashboard <ArrowRight className="ml-1 size-4" /></Link></Button>
            ) : (
              <>
                <Button asChild size="lg"><Link href="/register">Become a volunteer <ArrowRight className="ml-1 size-4" /></Link></Button>
                <Button asChild variant="outline" size="lg"><Link href="/login">I already have an account</Link></Button>
              </>
            )}
          </div>
        </div>
        <div className="relative isolate mx-auto grid min-h-[31rem] w-full max-w-[39rem] place-items-center overflow-hidden rounded-[2.6rem] bg-[#dceee5] p-7 shadow-[0_30px_70px_rgb(49_72_61_/_12%)] sm:min-h-[36rem] sm:rounded-[3.5rem] sm:p-10 lg:ml-auto">
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-[#f7dfcb]" aria-hidden="true" />
          <div className="absolute -bottom-24 -left-20 size-72 rounded-full bg-[#abd8c8]" aria-hidden="true" />
          <div className="absolute right-7 top-8 rotate-12 text-[#f5b897]" aria-hidden="true"><Sparkles className="size-16" strokeWidth={1.1} /></div>
          <HeroGallery />
        </div>
      </section>

      <section className="space-y-8" aria-labelledby="how-it-works">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-bold tracking-[0.12em] text-primary uppercase">How it works</p>
          <h2 id="how-it-works" className="!text-[clamp(2.3rem,4vw,3.5rem)]">Your tech skills can make a real difference in someone's everyday life.</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">Getting involved is simple. We&apos;ll help you find a place to start.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number} className="group rounded-[2rem] border border-border bg-white p-7 shadow-[0_12px_35px_rgb(49_72_61_/_5%)] transition-transform duration-300 hover:-translate-y-1">
              <div className="mb-8 flex items-start justify-between">
                <span className={`grid size-14 place-items-center rounded-2xl ${step.color}`}><step.icon className="size-6" strokeWidth={1.8} aria-hidden="true" /></span>
                <span className="font-heading text-sm font-semibold text-muted-foreground/60">{step.number}</span>
              </div>
              <h3 className="mb-3 text-2xl">{step.title}</h3>
              <p className="max-w-xs leading-relaxed text-muted-foreground">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2.5rem] bg-[#23584f] px-7 py-10 text-white sm:px-12 sm:py-14" aria-labelledby="together-title">
        <div className="absolute -right-16 -top-24 size-80 rounded-full border-[3rem] border-white/10" aria-hidden="true" />
        <div className="absolute bottom-[-8rem] right-1/4 size-56 rounded-full bg-[#317c6e]/60 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-bold tracking-[0.12em] text-[#bce6d9] uppercase">For local centers</p>
            <h2 id="together-title" className="!text-[clamp(2.3rem,4vw,3.4rem)] !leading-[1.05] text-white">Everything your center needs to keep tech support running smoothly.</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#e0f1e9]">Center staff can coordinate volunteers, appointments, events, and hours in one place.</p>
          </div>
          <Button asChild size="lg" className="shrink-0 !bg-white !text-[#23584f] !shadow-none hover:!bg-[#eef8f3]"><Link href="/staff/login">Staff sign in <ArrowRight className="ml-1 size-4" /></Link></Button>
        </div>
      </section>
    </div>
  )
}
