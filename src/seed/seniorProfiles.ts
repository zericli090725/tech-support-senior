import type { Payload } from 'payload'

import { getRelationID } from '@/lib/getRelationID'
import { seniorFullName, splitSeniorName, type SeniorContactMethod } from '@/lib/seniors'

export async function findOrCreateSenior(
  payload: Payload,
  args: {
    center: string
    firstName: string
    lastName: string
    contactMethod: SeniorContactMethod
    contact?: string | null
  },
): Promise<string> {
  const name = seniorFullName(args.firstName, args.lastName)
  const existing = await payload.find({
    collection: 'seniors',
    where: {
      and: [{ center: { equals: args.center } }, { name: { equals: name } }],
    },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) return String(existing.docs[0].id)

  const created = await payload.create({
    collection: 'seniors',
    data: {
      firstName: args.firstName,
      lastName: args.lastName,
      name,
      contactMethod: args.contactMethod,
      contact: args.contactMethod === 'center' ? null : args.contact || null,
      center: args.center,
    },
  })
  return String(created.id)
}

export async function linkUnlinkedTickets(payload: Payload): Promise<void> {
  const tickets = await payload.find({
    collection: 'tickets',
    where: {
      or: [{ senior: { exists: false } }, { senior: { equals: null } }],
    },
    limit: 1000,
    depth: 0,
    pagination: false,
  })
  if (tickets.docs.length === 0) return

  payload.logger.info(`Linking ${tickets.docs.length} tickets to senior profiles...`)

  for (const ticket of tickets.docs) {
    const center = getRelationID(ticket.center)
    const fullName = ticket.seniorName?.trim()
    if (!center || !fullName) continue
    const { firstName, lastName } = splitSeniorName(fullName)
    const senior = await findOrCreateSenior(payload, {
      center,
      firstName,
      lastName,
      contactMethod: 'center',
    })
    await payload.update({
      collection: 'tickets',
      id: ticket.id,
      data: { senior },
      depth: 0,
    })
  }
}
