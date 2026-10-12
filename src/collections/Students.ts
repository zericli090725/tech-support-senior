import type { CollectionConfig } from 'payload'

import { studentsCreate, studentsRead, studentsUpdate, superAdminOnly } from '@/access'

export const Students: CollectionConfig = {
  slug: 'students',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'createdAt'],
    group: 'Organization',
    description: 'Student volunteers. They log in on the public app, not the admin panel.',
  },
  auth: true,
  access: {
    admin: () => false,
    create: studentsCreate,
    read: studentsRead,
    update: studentsUpdate,
    delete: superAdminOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'memberships',
      type: 'join',
      collection: 'center-memberships',
      on: 'student',
      admin: {
        defaultColumns: ['center', 'status'],
      },
    },
    {
      name: 'hourLogs',
      type: 'join',
      collection: 'hour-logs',
      on: 'student',
      admin: {
        defaultColumns: ['hours', 'date', 'ticket', 'event'],
      },
    },
    {
      name: 'assignedTickets',
      type: 'join',
      collection: 'tickets',
      on: 'assignedStudent',
      admin: {
        defaultColumns: ['seniorName', 'status', 'center'],
      },
    },
  ],
}
