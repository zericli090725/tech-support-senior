import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Organization',
  },
  access: {
    read: () => true,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
