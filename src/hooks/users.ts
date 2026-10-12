import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

import { isSuperAdmin, type AccessUser } from '@/access/roles'

export const enforceUserCreate: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create') return data

  const { totalDocs } = await req.payload.count({ collection: 'users' })
  if (totalDocs === 0) {
    data.role = 'super-admin'
    data.center = null
    return data
  }

  if (!req.user) {
    return data
  }

  if (!isSuperAdmin(req.user as AccessUser)) {
    throw new APIError('Staff accounts can only be created by a super-admin.', 403)
  }

  if (data.role === 'staff' && !data.center) {
    throw new APIError('Staff members must be assigned to a center.', 400)
  }

  if (data.role === 'super-admin') {
    data.center = null
  }

  return data
}
