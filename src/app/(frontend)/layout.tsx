import { Fraunces, Nunito } from 'next/font/google'
import React from 'react'

import '../globals.css'

const sans = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
})

const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'WONK'],
  variable: '--font-fraunces',
})

export const metadata = {
  description: 'Students helping seniors with technology at local senior centers.',
  title: 'Senior Tech Support',
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className={sans.className}>{children}</body>
    </html>
  )
}
