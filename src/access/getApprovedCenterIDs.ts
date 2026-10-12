import type { PayloadRequest } from 'payload'

import { getRelationID } from '@/lib/getRelationID'

import { getStaffCenterID } from './getStaffCenterID'
import type { AccessUser } from './roles'

const APPROVED_CENTERS_KEY = 'approvedCenterIDs'
const STAFF_STUDENTS_KEY = 'studentIDsAtStaffCenter'

export async function getApprovedCenterIDs(req: PayloadRequest): Promise<string[]> {
  const user = req.user
  if (!user) return []

  const cached = req.context[APPROVED_CENTERS_KEY]
  if (Array.isArray(cached)) return cached as string[]

  const result = await req.payload.find({
    collection: 'center-memberships',
    where: {
      and: [{ student: { equals: user.id } }, { status: { equals: 'approved' } }],
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  const ids = result.docs
    .map((doc) => getRelationID(doc.center))
    .filter((id): id is string => Boolean(id))

  req.context[APPROVED_CENTERS_KEY] = ids
  return ids
}

export async function hasApprovedMembership(
  req: PayloadRequest,
  studentID: string,
  centerID: string,
): Promise<boolean> {
  const result = await req.payload.find({
    collection: 'center-memberships',
    where: {
      and: [
        { student: { equals: studentID } },
        { center: { equals: centerID } },
        { status: { equals: 'approved' } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  return result.totalDocs > 0
}

export async function getStudentIDsAtStaffCenter(req: PayloadRequest): Promise<string[]> {
  const cached = req.context[STAFF_STUDENTS_KEY]
  if (Array.isArray(cached)) return cached as string[]

  const centerID = getStaffCenterID(req.user as AccessUser | null)
  if (!centerID) return []

  const result = await req.payload.find({
    collection: 'center-memberships',
    where: {
      and: [{ center: { equals: centerID } }, { status: { equals: 'approved' } }],
    },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })

  const ids = result.docs
    .map((doc) => getRelationID(doc.student))
    .filter((id): id is string => Boolean(id))

  req.context[STAFF_STUDENTS_KEY] = ids
  return ids
}
