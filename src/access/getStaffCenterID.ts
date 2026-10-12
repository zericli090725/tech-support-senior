import { getRelationID } from '@/lib/getRelationID'

import { isStaff, type AccessUser } from './roles'

export const getStaffCenterID = (user: AccessUser | null | undefined): string | undefined => {
  if (!isStaff(user)) return undefined
  return getRelationID(user.center)
}
