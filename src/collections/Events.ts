import type { CollectionConfig } from 'payload'

import { adminOnly, centerScopedRead, centerScopedStaffWrite } from '@/access'
import { stampEventCenter } from '@/hooks/program'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'center', 'startsAt', 'locationInCenter'],
    group: 'Program',
    description: 'Group days that bring students and seniors together at a center.',
  },
  defaultSort: 'startsAt',
  access: {
    create: adminOnly,
    read: centerScopedRead,
    update: centerScopedStaffWrite,
    delete: centerScopedStaffWrite,
  },
  hooks: {
    beforeChange: [stampEventCenter],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
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
      name: 'startsAt',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'endsAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'locationInCenter',
      type: 'text',
      admin: {
        description: 'Room or area inside the center, e.g. Community Room.',
      },
    },
    {
      name: 'maxStudents',
      type: 'number',
      min: 1,
      admin: {
        description: 'Optional cap on student RSVPs.',
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'tickets',
      type: 'join',
      collection: 'tickets',
      on: 'event',
      admin: {
        defaultColumns: ['seniorName', 'status', 'assignedStudent'],
      },
    },
    {
      name: 'rsvps',
      type: 'join',
      collection: 'event-rsvps',
      on: 'event',
      admin: {
        defaultColumns: ['student', 'status'],
      },
    },
  ],
}
