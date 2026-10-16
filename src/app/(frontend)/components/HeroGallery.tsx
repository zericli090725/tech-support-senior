'use client'

import Image from 'next/image'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useState } from 'react'

import communityFeedback from '@/assets/gallery/community-feedback.webp'
import communityTeam from '@/assets/gallery/community-team.webp'
import helpSession from '@/assets/gallery/help-session.webp'
import techHelpSign from '@/assets/gallery/tech-help-sign.webp'

const photos = [
  {
    src: communityTeam,
    alt: 'Students, older adults, and community members together outside Seven Oaks Community Center',
    position: 'center center',
  },
  {
    src: helpSession,
    alt: 'Students and older adults working together at tables during a community tech help session',
    position: 'center center',
  },
  {
    src: techHelpSign,
    alt: 'A Tech Help sign inviting neighbors to sign up at Seven Oaks Center',
    position: 'center center',
  },
  {
    src: communityFeedback,
    alt: 'Paper feedback forms completed after tech help sessions',
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
  const [activeIndex, setActiveIndex] = useState(0)
  const arrowButtonClass =
    'grid h-11 w-14 place-items-center rounded-[1rem] border border-[#245449] bg-transparent text-[#245449] transition-colors hover:bg-white/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

  return (
    <div
      className="relative z-10 w-full max-w-[30rem]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Community photo gallery"
    >
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-1 rotate-[3deg] translate-x-2 translate-y-3 rounded-[2rem] border border-[#e9ccbb] bg-[#f8e7dc] shadow-[0_12px_30px_rgb(79_75_54_/_8%)]"
          aria-hidden="true"
        />
        <div className="relative rotate-[-2deg] rounded-[1.9rem] bg-white p-[7px] shadow-[0_24px_55px_rgb(28_66_55_/_20%)]">
          <div
            id="hero-gallery-stage"
            className="gallery-stage relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] bg-[#d3dfd5]"
          >
            {photos.map((photo, index) => (
              <div
                key={photo.alt}
                className="gallery-slide"
                data-active={index === activeIndex}
                aria-hidden={index !== activeIndex}
              >
                <PhotoFace photo={photo} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="relative mt-8 flex items-center justify-between px-1 sm:px-2">
        <button
          type="button"
          aria-label="Previous photo"
          aria-controls="hero-gallery-stage"
          onClick={() =>
            setActiveIndex(
              (index) => (index - 1 + photos.length) % photos.length,
            )
          }
          className={arrowButtonClass}
        >
          <ArrowLeft className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </button>
        <div
          className="flex items-center gap-2 font-heading text-sm font-semibold tracking-[0.12em] text-[#245449]"
          aria-hidden="true"
        >
          <span>{String(activeIndex + 1).padStart(2, '0')}</span>
          <span className="h-px w-6 bg-[#8fb3a0]" />
          <span className="text-[#7b9c8b]">
            {String(photos.length).padStart(2, '0')}
          </span>
        </div>
        <button
          type="button"
          aria-label="Next photo"
          aria-controls="hero-gallery-stage"
          onClick={() => setActiveIndex((index) => (index + 1) % photos.length)}
          className={arrowButtonClass}
        >
          <ArrowRight className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        Photo {activeIndex + 1} of {photos.length}
      </span>
    </div>
  )
}
