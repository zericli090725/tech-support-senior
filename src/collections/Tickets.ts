import type { CollectionConfig } from 'payload'

import { adminOnly, centerScopedStaffWrite, ticketsRead, ticketsUpdate } from '@/access'
import { getRelationID } from '@/lib/getRelationID'
import { stampTicketDefaults } from '@/hooks/program'

export const Tickets: CollectionConfig = {
  slug: 'tickets',
  labels: {
    singular: 'Ticket',
    plural: 'Tickets',
  },
  admin: {
    useAsTitle: 'seniorName',
    defaultColumns: ['seniorName', 'center', 'status', 'assignedStudent', 'scheduledAt'],
    group: 'Program',
    description: 'One visit for a senior. Link a profile so the center can see their history.',
    listSearchableFields: ['seniorName', 'issue'],
  },
  defaultSort: '-createdAt',
  access: {
    create: adminOnly,
    read: ticketsRead,
    update: ticketsUpdate,
    delete: centerScopedStaffWrite,
  },
  hooks: {
    beforeChange: [stampTicketDefaults],
  },
  fields: [
    {
      name: 'seniorName',
      type: 'text',
      required: true,
    },
    {
      name: 'senior',
      type: 'relationship',
      relationTo: 'seniors',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Link a profile so this center keeps the senior’s history.',
      },
      filterOptions: ({ data }) => {
        const centerID = getRelationID(data?.center)
        if (!centerID) return true
        return { center: { equals: centerID } }
      },
    },
    {
      name: 'seniorNotes',
      type: 'textarea',
      admin: {
        description: 'Optional context for the volunteer (device owner, accessibility, etc.).',
      },
    },
    {
      name: 'issue',
      type: 'textarea',
      required: true,
    },
    {
      name: 'device',
      type: 'select',
      options: [
        { label: 'Phone', value: 'phone' },
        { label: 'Tablet', value: 'tablet' },
        { label: 'Computer', value: 'computer' },
        { label: 'TV', value: 'tv' },
        { label: 'Other', value: 'other' },
      ],
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
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      admin: {
        position: 'sidebar',
        description: 'Optional. Link this senior to a group event day.',
      },
      filterOptions: ({ data }) => {
        const centerID = getRelationID(data?.center)
        if (!centerID) return true
        return { center: { equals: centerID } }
      },
    },
    {
      name: 'scheduledAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
    },
    {
      name: 'assignedStudent',
      type: 'relationship',
      relationTo: 'students',
      admin: {
        position: 'sidebar',
        description: 'Leave empty so approved students can claim this ticket.',
      },
      filterOptions: async ({ data, req }) => {
        const centerID = getRelationID(data?.center)
        if (!centerID) return false
        const memberships = await req.payload.find({
          collection: 'center-memberships',
          where: {
            and: [{ center: { equals: centerID } }, { status: { equals: 'approved' } }],
          },
          depth: 0,
          limit: 200,
          overrideAccess: true,
        })
        const ids = memberships.docs
          .map((doc) => getRelationID(doc.student))
          .filter((id): id is string => Boolean(id))
        if (ids.length === 0) return false
        return { id: { in: ids } }
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      index: true,
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Assigned', value: 'assigned' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
      },
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
  ],
}
