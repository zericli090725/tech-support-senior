import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { CenterMemberships } from './collections/CenterMemberships'
import { Centers } from './collections/Centers'
import { EventRsvps } from './collections/EventRsvps'
import { Events } from './collections/Events'
import { HourLogs } from './collections/HourLogs'
import { Media } from './collections/Media'
import { Seniors } from './collections/Seniors'
import { Students } from './collections/Students'
import { TicketNotes } from './collections/TicketNotes'
import { Tickets } from './collections/Tickets'
import { Users } from './collections/Users'
import { seed } from './seed'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— Senior Tech Support',
    },
  },
  collections: [
    Users,
    Students,
    Centers,
    Seniors,
    CenterMemberships,
    Events,
    EventRsvps,
    Tickets,
    TicketNotes,
    HourLogs,
    Media,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [],
  onInit: async (payload) => {
    await seed(payload)
  },
})
