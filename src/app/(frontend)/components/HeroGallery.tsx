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
        </div>
      </div>
      <div className="relative mt-8 flex items-center justify-between px-1 sm:px-2">
        <button
          type="button"
          aria-label="Previous photo"
          aria-controls="hero-gallery-stage"
          onClick={() =>
            showPhoto((activeIndex - 1 + photos.length) % photos.length)
          }
          className="grid h-11 w-14 place-items-center rounded-[1rem] border border-[#bdd3c5] bg-[#fffdf8] text-[#245449] shadow-[0_6px_16px_rgb(38_78_61_/_8%)] transition-all hover:-translate-x-0.5 hover:border-[#245449] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="size-5" strokeWidth={1.8} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2 font-heading text-sm font-semibold tracking-[0.12em] text-[#245449]" aria-hidden="true">
          <span>{String(activeIndex + 1).padStart(2, '0')}</span>
          <span className="h-px w-6 bg-[#8fb3a0]" />
          <span className="text-[#7b9c8b]">{String(photos.length).padStart(2, '0')}</span>
        </div>
        <button
          type="button"
          aria-label="Next photo"
          aria-controls="hero-gallery-stage"
          onClick={() => showPhoto((activeIndex + 1) % photos.length)}
          className="grid h-11 w-14 place-items-center rounded-[1rem] bg-[#245449] text-white shadow-[0_8px_18px_rgb(28_66_55_/_18%)] transition-all hover:translate-x-0.5 hover:bg-[#19463c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
