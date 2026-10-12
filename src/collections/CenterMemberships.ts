import type { CollectionConfig } from 'payload'

import { membershipsRead, membershipsUpdate, superAdminOnly } from '@/access'
import { isStudent, isSuperAdmin, type AccessUser } from '@/access/roles'
import { stampMembershipDefaults } from '@/hooks/program'

export const CenterMemberships: CollectionConfig = {
  slug: 'center-memberships',
  labels: {
    singular: 'Center membership',
    plural: 'Center memberships',
  },
  admin: {
    useAsTitle: 'status',
    defaultColumns: ['student', 'center', 'status', 'updatedAt'],
    group: 'Program',
    description: 'Approve student volunteers before they can claim tickets or RSVP at a center.',
  },
  access: {
    create: ({ req: { user } }) =>
      isStudent(user as AccessUser) || isSuperAdmin(user as AccessUser),
    read: membershipsRead,
    update: membershipsUpdate,
    delete: superAdminOnly,
  },
  hooks: {
    beforeChange: [stampMembershipDefaults],
  },
  indexes: [
    {
      fields: ['student', 'center'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'students',
      required: true,
      index: true,
    },
    {
      name: 'center',
      type: 'relationship',
      relationTo: 'centers',
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
  ],
}
