import { DM_Sans, Outfit } from 'next/font/google'
import React from 'react'

import '../globals.css'

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const display = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
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
