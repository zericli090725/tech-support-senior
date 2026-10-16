type Props = {
  eyebrow?: string
  title: string
  description?: string
}

export function PageIntro({ eyebrow, title, description }: Props) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      {eyebrow ? <p className="text-xs font-bold tracking-[0.12em] text-primary uppercase">{eyebrow}</p> : null}
      <h1 className="text-4xl leading-[1.05] sm:text-5xl">{title}</h1>
      {description ? (
        <p className="text-lg leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
