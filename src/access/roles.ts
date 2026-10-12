export type StaffRole = 'super-admin' | 'staff'

export type AccessUser = {
  id: string
  collection?: string
  role?: StaffRole | null
  center?: unknown
}

export function isSuperAdmin(user: AccessUser | null | undefined): user is AccessUser & {
  collection: 'users'
  role: 'super-admin'
} {
  return user?.collection === 'users' && user.role === 'super-admin'
}

export function isStaff(user: AccessUser | null | undefined): user is AccessUser & {
  collection: 'users'
  role: 'staff'
} {
  return user?.collection === 'users' && user.role === 'staff'
}

export function isStudent(user: AccessUser | null | undefined): user is AccessUser & {
  collection: 'students'
} {
  return user?.collection === 'students'
}

export const isAdminUser = (user: AccessUser | null | undefined): boolean =>
  isSuperAdmin(user) || isStaff(user)
