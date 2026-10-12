import type { CollectionConfig } from 'payload'

import { rsvpsRead, rsvpsUpdate } from '@/access'
import { isStudent, isSuperAdmin, type AccessUser } from '@/access/roles'
import { stampEventRsvpDefaults } from '@/hooks/program'

export const EventRsvps: CollectionConfig = {
  slug: 'event-rsvps',
  labels: {
    singular: 'Event RSVP',
    plural: 'Event RSVPs',
  },
  admin: {
    useAsTitle: 'status',
    defaultColumns: ['event', 'student', 'status', 'updatedAt'],
    group: 'Program',
  },
  access: {
    create: ({ req: { user } }) => isStudent(user as AccessUser) || isSuperAdmin(user as AccessUser),
    read: rsvpsRead,
    update: rsvpsUpdate,
    delete: ({ req: { user } }) => isSuperAdmin(user as AccessUser),
  },
  hooks: {
    beforeChange: [stampEventRsvpDefaults],
  },
  indexes: [
    {
      fields: ['event', 'student'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
      index: true,
    },
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'students',
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'going',
      options: [
        { label: 'Going', value: 'going' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
  ],
}
