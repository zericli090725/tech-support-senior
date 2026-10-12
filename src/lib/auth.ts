import { cache } from 'react'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

import { isAdminUser, isStudent, isSuperAdmin, type AccessUser } from '@/access/roles'

export const getAuth = cache(async (): Promise<{ user: AccessUser | null; payload: Payload }> => {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })
  return { user: (user as AccessUser | null) ?? null, payload }
})

export async function requireStudent(): Promise<{ user: AccessUser; payload: Payload }> {
  const { user, payload } = await getAuth()
  if (isAdminUser(user)) redirect('/staff')
  if (!user || !isStudent(user)) redirect('/login')
  return { user, payload }
}

export async function requireStaff(): Promise<{ user: AccessUser; payload: Payload }> {
  const { user, payload } = await getAuth()
  if (isStudent(user)) redirect('/dashboard')
  if (!user || !isAdminUser(user)) redirect('/staff/login')
  return { user, payload }
}

export async function requireSuperAdmin(): Promise<{ user: AccessUser; payload: Payload }> {
  const auth = await requireStaff()
  if (!isSuperAdmin(auth.user)) redirect('/staff')
  return auth
}
