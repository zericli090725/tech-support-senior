'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import communityFeedback from '@/assets/gallery/community-feedback.webp'
import communityTeam from '@/assets/gallery/community-team.webp'
import helpSession from '@/assets/gallery/help-session.webp'
import techHelpSign from '@/assets/gallery/tech-help-sign.webp'

const photos = [
  {
    src: communityTeam,
    alt: 'Students, older adults, and community members together outside Seven Oaks Community Center',
    caption: 'The people behind the help',
    position: 'center center',
  },
  {
    src: helpSession,
    alt: 'Students and older adults working together at tables during a community tech help session',
    caption: 'Learning side by side',
    position: 'center center',
  },
  {
    src: techHelpSign,
    alt: 'A Tech Help sign inviting neighbors to sign up at Seven Oaks Center',
    caption: 'A warm welcome starts here',
    position: 'center center',
  },
  {
    src: communityFeedback,
    alt: 'Paper feedback forms completed after tech help sessions',
    caption: 'Every voice helps us grow',
    position: 'center 58%',
  },
] as const

type Photo = (typeof photos)[number]

function PhotoFace({ photo }: { photo: Photo }) {
  return (
    <div className="gallery-face">
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(max-width: 1024px) 85vw, 460px"
        placeholder="blur"
        className="object-cover"
        style={{ objectPosition: photo.position }}
      />
    </div>
  )
}

export function HeroGallery() {
  const [frontIndex, setFrontIndex] = useState(0)
  const [backIndex, setBackIndex] = useState(1)
  const [flipped, setFlipped] = useState(false)
  const activeIndex = flipped ? backIndex : frontIndex

  function showPhoto(index: number) {
    if (index === activeIndex) return
    if (flipped) setFrontIndex(index)
    else setBackIndex(index)
    setFlipped(!flipped)
  }

  return (
    <div
      className="relative z-10 w-full max-w-[29rem]"
      aria-label="Community photo gallery"
    >
      <div
        id="hero-gallery-stage"
        className="gallery-stage aspect-[4/3] w-full rotate-[-3deg]"
      >
        <div className="gallery-card" data-flipped={flipped}>
          <div aria-hidden={flipped} className="gallery-side">
            <PhotoFace photo={photos[frontIndex]} />
          </div>
          <div
            aria-hidden={!flipped}
            className="gallery-side gallery-side-back"
          >
            <PhotoFace photo={photos[backIndex]} />
          </div>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between gap-3 rounded-[1.4rem] border border-white bg-white/95 px-4 py-3 shadow-[0_12px_28px_rgb(33_63_58_/_10%)] sm:px-5">
        <div className="min-w-0" aria-live="polite" aria-atomic="true">
          <p className="text-[0.65rem] font-bold tracking-[0.13em] text-primary uppercase">
            Community moments · {String(activeIndex + 1).padStart(2, '0')}/04
          </p>
          <p className="truncate font-heading text-base font-semibold text-foreground sm:text-lg">
            {photos[activeIndex].caption}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous photo"
            aria-controls="hero-gallery-stage"
            onClick={() =>
              showPhoto((activeIndex - 1 + photos.length) % photos.length)
            }
            className="grid size-9 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-10"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            aria-controls="hero-gallery-stage"
            onClick={() => showPhoto((activeIndex + 1) % photos.length)}
            className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-10"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        className="mt-4 flex justify-center gap-2"
        aria-label="Choose a gallery photo"
      >
        {photos.map((photo, index) => (
          <button
            key={photo.caption}
            type="button"
            aria-label={`Show photo ${index + 1}: ${photo.caption}`}
            aria-pressed={activeIndex === index}
            onClick={() => showPhoto(index)}
            className={`h-2 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${activeIndex === index ? 'w-6 bg-primary' : 'w-2 bg-[#8db9aa] hover:bg-[#4c8d7e]'}`}
          />
        ))}
      </div>
    </div>
  )
}
