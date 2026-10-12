import type { Access, Where } from 'payload'

import { getApprovedCenterIDs, getStudentIDsAtStaffCenter } from './getApprovedCenterIDs'
import { getStaffCenterID } from './getStaffCenterID'
import { isAdminUser, isStaff, isStudent, isSuperAdmin, type AccessUser } from './roles'

export { getApprovedCenterIDs, hasApprovedMembership } from './getApprovedCenterIDs'
export { getStaffCenterID } from './getStaffCenterID'
export { isAdminUser, isStaff, isStudent, isSuperAdmin } from './roles'
export type { AccessUser, StaffRole } from './roles'

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const superAdminOnly: Access = ({ req: { user } }) => isSuperAdmin(user as AccessUser)

export const adminOnly: Access = ({ req: { user } }) => isAdminUser(user as AccessUser)

export const canUseAdmin = ({ req: { user } }: { req: { user?: unknown } }): boolean =>
  isAdminUser(user as AccessUser)

/** Matches no documents. Use for list `read` instead of `false`, which throws 403. */
export const noDocuments: Where = { id: { equals: '__none__' } }

export const centerScopedRead: Access = async ({ req }): Promise<boolean | Where> => {
  const user = req.user as AccessUser | null
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isStaff(user)) {
    const centerID = getStaffCenterID(user)
    if (!centerID) return noDocuments
    return { center: { equals: centerID } }
  }
  if (isStudent(user)) {
    const ids = await getApprovedCenterIDs(req)
    if (ids.length === 0) return noDocuments
    return { center: { in: ids } }
  }
  return false
}

export const ticketsRead: Access = async ({ req }): Promise<boolean | Where> => {
  const user = req.user as AccessUser | null
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isStaff(user)) {
    const centerID = getStaffCenterID(user)
    if (!centerID) return noDocuments
    return { center: { equals: centerID } }
  }
  if (isStudent(user)) {
    const ids = await getApprovedCenterIDs(req)
    const assignedToSelf: Where = { assignedStudent: { equals: user.id } }
    if (ids.length === 0) return assignedToSelf
    return { or: [{ center: { in: ids } }, assignedToSelf] }
  }
  return false
}

export const seniorsRead: Access = ({ req: { user } }): boolean | Where => {
  const accessUser = user as AccessUser | null
  if (!accessUser) return false
  if (isSuperAdmin(accessUser)) return true
  if (isStaff(accessUser)) {
    const centerID = getStaffCenterID(accessUser)
    if (!centerID) return noDocuments
    return { center: { equals: centerID } }
  }
  return false
}

export const centerScopedStaffWrite: Access = ({ req: { user } }): boolean | Where => {
  const accessUser = user as AccessUser | null
  if (!accessUser) return false
  if (isSuperAdmin(accessUser)) return true
  if (isStaff(accessUser)) {
    const centerID = getStaffCenterID(accessUser)
    if (!centerID) return false
    return { center: { equals: centerID } }
  }
  return false
}

export const ticketsUpdate: Access = async ({ req }): Promise<boolean | Where> => {
  const user = req.user as AccessUser | null
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isStaff(user)) {
    const centerID = getStaffCenterID(user)
    if (!centerID) return false
    return { center: { equals: centerID } }
  }
  if (isStudent(user)) {
    const ids = await getApprovedCenterIDs(req)
    const ownAssigned: Where = { assignedStudent: { equals: user.id } }
    if (ids.length === 0) return ownAssigned
    return {
      or: [{ and: [{ center: { in: ids } }, { status: { equals: 'open' } }] }, ownAssigned],
    }
  }
  return false
}

export const ticketNotesCreate: Access = ({ req: { user } }) => {
  const accessUser = user as AccessUser | null
  return isStudent(accessUser) || isAdminUser(accessUser)
}

export const ticketNotesRead: Access = async ({ req }): Promise<boolean | Where> => {
  const user = req.user as AccessUser | null
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isStaff(user)) {
    const centerID = getStaffCenterID(user)
    if (!centerID) return noDocuments
    return { 'ticket.center': { equals: centerID } }
  }
  if (isStudent(user)) {
    const ids = await getApprovedCenterIDs(req)
    const own: Where = { 'ticket.assignedStudent': { equals: user.id } }
    if (ids.length === 0) return own
    return { or: [{ 'ticket.center': { in: ids } }, own] }
  }
  return false
}

export const membershipsRead: Access = ({ req: { user } }): boolean | Where => {
  const accessUser = user as AccessUser | null
  if (!accessUser) return false
  if (isSuperAdmin(accessUser)) return true
  if (isStaff(accessUser)) {
    const centerID = getStaffCenterID(accessUser)
    if (!centerID) return false
    return { center: { equals: centerID } }
  }
  if (isStudent(accessUser)) {
    return { student: { equals: accessUser.id } }
  }
  return false
}

export const membershipsUpdate: Access = ({ req: { user } }): boolean | Where => {
  const accessUser = user as AccessUser | null
  if (!accessUser) return false
  if (isSuperAdmin(accessUser)) return true
  if (isStaff(accessUser)) {
    const centerID = getStaffCenterID(accessUser)
    if (!centerID) return false
    return { center: { equals: centerID } }
  }
  return false
}

export const rsvpsRead: Access = ({ req: { user } }): boolean | Where => {
  const accessUser = user as AccessUser | null
  if (!accessUser) return false
  if (isSuperAdmin(accessUser)) return true
  if (isStaff(accessUser)) {
    const centerID = getStaffCenterID(accessUser)
    if (!centerID) return false
    return { 'event.center': { equals: centerID } }
  }
  if (isStudent(accessUser)) {
    return { student: { equals: accessUser.id } }
  }
  return false
}

export const rsvpsUpdate: Access = ({ req: { user } }): boolean | Where => {
  const accessUser = user as AccessUser | null
  if (!accessUser) return false
  if (isSuperAdmin(accessUser)) return true
  if (isStudent(accessUser)) {
    return { student: { equals: accessUser.id } }
  }
  return false
}

export const usersRead: Access = ({ req: { user } }): boolean | Where => {
  const accessUser = user as AccessUser | null
  if (!accessUser) return false
  if (isSuperAdmin(accessUser)) return true
  if (isStaff(accessUser)) return { id: { equals: accessUser.id } }
  return false
}

export const usersUpdate: Access = ({ req: { user } }): boolean | Where => {
  const accessUser = user as AccessUser | null
  if (!accessUser) return false
  if (isSuperAdmin(accessUser)) return true
  if (isStaff(accessUser)) return { id: { equals: accessUser.id } }
  return false
}

export const usersCreate: Access = async ({ req }) => {
  if (isSuperAdmin(req.user as AccessUser)) return true
  const { totalDocs } = await req.payload.count({ collection: 'users' })
  return totalDocs === 0
}

export const studentsRead: Access = ({ req: { user } }): boolean | Where => {
  const accessUser = user as AccessUser | null
  if (!accessUser) return false
  if (isSuperAdmin(accessUser) || isStaff(accessUser)) return true
  if (isStudent(accessUser)) return { id: { equals: accessUser.id } }
  return false
}

export const studentsUpdate: Access = ({ req: { user } }): boolean | Where => {
  const accessUser = user as AccessUser | null
  if (!accessUser) return false
  if (isSuperAdmin(accessUser)) return true
  if (isStudent(accessUser)) return { id: { equals: accessUser.id } }
  return false
}

export const studentsCreate: Access = ({ req: { user } }) => {
  if (!user) return true
  return isSuperAdmin(user as AccessUser)
}

export const hourLogsRead: Access = async ({ req }): Promise<boolean | Where> => {
  const user = req.user as AccessUser | null
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (isStudent(user)) return { student: { equals: user.id } }
  if (isStaff(user)) {
    const ids = await getStudentIDsAtStaffCenter(req)
    if (ids.length === 0) return noDocuments
    return { student: { in: ids } }
  }
  return false
}

export const hourLogsWriteOwn: Access = ({ req: { user } }): boolean | Where => {
  const accessUser = user as AccessUser | null
  if (!accessUser) return false
  if (isSuperAdmin(accessUser)) return true
  if (isStudent(accessUser)) return { student: { equals: accessUser.id } }
  return false
}

export const hourLogsCreate: Access = ({ req: { user } }) => {
  const accessUser = user as AccessUser | null
  return isStudent(accessUser) || isSuperAdmin(accessUser)
}
