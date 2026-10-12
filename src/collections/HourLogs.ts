import type { CollectionConfig, Where } from 'payload'

import { hourLogsCreate, hourLogsRead, hourLogsWriteOwn } from '@/access'
import { isStudent, isStaff, type AccessUser } from '@/access/roles'
import { getStaffCenterID } from '@/access/getStaffCenterID'
import { stampHourLogDefaults } from '@/hooks/program'

export const HourLogs: CollectionConfig = {
  slug: 'hour-logs',
  labels: {
    singular: 'Hour log',
    plural: 'Hour logs',
  },
  admin: {
    defaultColumns: ['student', 'hours', 'date', 'ticket', 'event'],
    group: 'Program',
    description: 'Volunteer hours logged by students, optionally linked to a ticket or event.',
  },
  defaultSort: '-date',
  access: {
    create: hourLogsCreate,
    read: hourLogsRead,
    update: hourLogsWriteOwn,
    delete: hourLogsWriteOwn,
  },
  hooks: {
    beforeChange: [stampHourLogDefaults],
  },
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'students',
      required: true,
      index: true,
      admin: {
        description: 'Set automatically when a student logs hours from their profile.',
      },
    },
    {
      name: 'hours',
      type: 'number',
      required: true,
      min: 0.25,
      max: 24,
      admin: {
        step: 0.25,
        description: 'Time spent helping, in hours.',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'ticket',
      type: 'relationship',
      relationTo: 'tickets',
      filterOptions: ({ user }): boolean | Where => {
        const accessUser = user as AccessUser
        if (isStudent(accessUser)) {
          return { assignedStudent: { equals: accessUser.id } }
        }
        if (isStaff(accessUser)) {
          const centerID = getStaffCenterID(accessUser)
          if (!centerID) return false
          return { center: { equals: centerID } }
        }
        return true
      },
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      filterOptions: ({ user }) => {
        const accessUser = user as AccessUser
        if (isStaff(accessUser)) {
          const centerID = getStaffCenterID(accessUser)
          if (!centerID) return false
          return { center: { equals: centerID } }
        }
        return true
      },
    },
  ],
}
