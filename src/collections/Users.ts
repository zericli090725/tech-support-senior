import type { CollectionConfig } from 'payload'

import {
  canUseAdmin,
  superAdminOnly,
  usersCreate,
  usersRead,
  usersUpdate,
} from '@/access'
import { isSuperAdmin, type AccessUser } from '@/access/roles'
import { enforceUserCreate } from '@/hooks/users'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Staff user',
    plural: 'Staff users',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'center'],
    group: 'Organization',
    description: 'Center staff and super-admins who use the admin panel.',
  },
  auth: true,
  access: {
    admin: canUseAdmin,
    create: usersCreate,
    read: usersRead,
    update: usersUpdate,
    delete: superAdminOnly,
  },
  hooks: {
    beforeChange: [enforceUserCreate],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'staff',
      saveToJWT: true,
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Staff', value: 'staff' },
      ],
      access: {
        update: ({ req: { user } }) => isSuperAdmin(user as AccessUser),
      },
    },
    {
      name: 'center',
      type: 'relationship',
      relationTo: 'centers',
      saveToJWT: true,
      admin: {
        condition: (data) => data?.role === 'staff',
        description: 'The senior center this staff member works at.',
      },
      access: {
        update: ({ req: { user } }) => isSuperAdmin(user as AccessUser),
      },
      validate: (value: unknown, { data }: { data?: { role?: string } }) => {
        if (data?.role === 'staff' && !value) {
          return 'Staff members must be assigned to a center'
        }
        return true
      },
    },
  ],
}
