import type { CollectionConfig } from 'payload'

import { superAdminOnly, ticketNotesCreate, ticketNotesRead } from '@/access'
import { stampTicketNote } from '@/hooks/program'

export const TicketNotes: CollectionConfig = {
  slug: 'ticket-notes',
  labels: {
    singular: 'Ticket note',
    plural: 'Ticket notes',
  },
  admin: {
    useAsTitle: 'authorName',
    defaultColumns: ['ticket', 'authorName', 'status', 'createdAt'],
    group: 'Program',
    description: 'Notes left by the assigned student or center staff. A note can also change the ticket status.',
  },
  defaultSort: 'createdAt',
  access: {
    create: ticketNotesCreate,
    read: ticketNotesRead,
    update: () => false,
    delete: superAdminOnly,
  },
  hooks: {
    beforeChange: [stampTicketNote],
  },
  fields: [
    {
      name: 'ticket',
      type: 'relationship',
      relationTo: 'tickets',
      required: true,
      index: true,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'authorName',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'authorRole',
      type: 'select',
      required: true,
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Staff', value: 'staff' },
      ],
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Assigned', value: 'assigned' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        description: 'Ticket status chosen when this note was added.',
      },
    },
  ],
}
