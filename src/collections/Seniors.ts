import type { CollectionConfig } from 'payload'

import { adminOnly, centerScopedStaffWrite, seniorsRead } from '@/access'
import { stampSeniorDefaults, syncLinkedTicketNames } from '@/hooks/program'

export const Seniors: CollectionConfig = {
  slug: 'seniors',
  labels: {
    singular: 'Senior',
    plural: 'Seniors',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'center', 'contactMethod', 'contact'],
    group: 'Organization',
    description: 'A person who gets help at a center. Link tickets here to keep their history.',
    listSearchableFields: ['name', 'firstName', 'lastName', 'contact'],
  },
  defaultSort: 'lastName',
  access: {
    create: adminOnly,
    read: seniorsRead,
    update: centerScopedStaffWrite,
    delete: centerScopedStaffWrite,
  },
  hooks: {
    beforeValidate: [stampSeniorDefaults],
    afterChange: [syncLinkedTicketNames],
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
      admin: {
        hidden: true,
        description: 'First and last name, kept together for search and ticket history.',
      },
    },
    {
      name: 'contactMethod',
      type: 'select',
      required: true,
      defaultValue: 'center',
      options: [
        { label: 'Cell', value: 'cell' },
        { label: 'Email', value: 'email' },
        { label: 'Through the center', value: 'center' },
      ],
      admin: {
        description: 'How staff should reach this senior.',
      },
    },
    {
      name: 'contact',
      type: 'text',
      admin: {
        description: 'Cell number or email. Leave blank when the center makes contact.',
      },
    },
    {
      name: 'center',
      type: 'relationship',
      relationTo: 'centers',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tickets',
      type: 'join',
      collection: 'tickets',
      on: 'senior',
      admin: {
        defaultColumns: ['issue', 'status', 'scheduledAt'],
      },
    },
  ],
}
