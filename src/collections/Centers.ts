import type { CollectionConfig } from 'payload'

import { authenticated, superAdminOnly } from '@/access'

export const Centers: CollectionConfig = {
  slug: 'centers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'address', 'updatedAt'],
    group: 'Organization',
    listSearchableFields: ['name', 'address'],
  },
  access: {
    create: superAdminOnly,
    read: authenticated,
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'address',
      type: 'text',
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes for staff (parking, front desk, etc.).',
      },
    },
  ],
}
