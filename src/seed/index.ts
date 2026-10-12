import type { Payload } from 'payload'

import { findOrCreateSenior, linkUnlinkedTickets } from './seniorProfiles'
import { seedSanDiego } from './sanDiego'

const SEED_PASSWORD = 'changeme'

async function emailExists(
  payload: Payload,
  collection: 'users' | 'students',
  email: string,
): Promise<boolean> {
  const result = await payload.find({
    collection,
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })
  return result.totalDocs > 0
}

export async function seed(payload: Payload): Promise<void> {
  await seedCore(payload)
  await seedSanDiego(payload)
  await linkUnlinkedTickets(payload)
}

async function seedCore(payload: Payload): Promise<void> {
  if (await emailExists(payload, 'users', 'admin@example.com')) {
    payload.logger.info('Core seed already present, skipping.')
    return
  }

  payload.logger.info('Seeding senior tech support data...')

  const lakeside = await payload.create({
    collection: 'centers',
    data: {
      name: 'Lakeside Senior Center',
      address: '100 Lake Avenue',
      notes: 'Check in at the front desk. Help sessions usually use the community room.',
    },
  })

  const hilltop = await payload.create({
    collection: 'centers',
    data: {
      name: 'Hilltop Community Center',
      address: '50 Hill Street',
      notes: 'Parking is behind the building.',
    },
  })

  await payload.create({
    collection: 'users',
    data: {
      name: 'Super Admin',
      email: 'admin@example.com',
      password: SEED_PASSWORD,
      role: 'super-admin',
    },
  })

  const maria = await payload.create({
    collection: 'users',
    data: {
      name: 'Maria Chen',
      email: 'maria@lakeside.org',
      password: SEED_PASSWORD,
      role: 'staff',
      center: lakeside.id,
    },
  })

  await payload.create({
    collection: 'users',
    data: {
      name: 'James Patel',
      email: 'james@hilltop.org',
      password: SEED_PASSWORD,
      role: 'staff',
      center: hilltop.id,
    },
  })

  const alex = await payload.create({
    collection: 'students',
    data: {
      name: 'Alex Rivera',
      email: 'alex@student.edu',
      password: SEED_PASSWORD,
    },
  })

  const sam = await payload.create({
    collection: 'students',
    data: {
      name: 'Sam Okonkwo',
      email: 'sam@student.edu',
      password: SEED_PASSWORD,
    },
  })

  await payload.create({
    collection: 'center-memberships',
    data: {
      student: alex.id,
      center: lakeside.id,
      status: 'approved',
    },
  })

  await payload.create({
    collection: 'center-memberships',
    data: {
      student: alex.id,
      center: hilltop.id,
      status: 'pending',
    },
  })

  await payload.create({
    collection: 'center-memberships',
    data: {
      student: sam.id,
      center: lakeside.id,
      status: 'pending',
    },
  })

  const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000)

  const techThursday = await payload.create({
    collection: 'events',
    data: {
      title: 'Tech Help Thursday',
      center: lakeside.id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      locationInCenter: 'Community Room',
      maxStudents: 8,
      description: 'Drop-in device help for members. Students pair with seniors on-site.',
      createdBy: maria.id,
    },
  })

  await payload.create({
    collection: 'event-rsvps',
    data: {
      event: techThursday.id,
      student: alex.id,
      status: 'going',
    },
  })

  const margaret = await findOrCreateSenior(payload, {
    center: String(lakeside.id),
    firstName: 'Margaret',
    lastName: 'Chen',
    contactMethod: 'email',
    contact: 'margaret.chen@example.com',
  })
  const robert = await findOrCreateSenior(payload, {
    center: String(lakeside.id),
    firstName: 'Robert',
    lastName: 'Alvarez',
    contactMethod: 'cell',
    contact: '619-555-0142',
  })
  const dorothy = await findOrCreateSenior(payload, {
    center: String(lakeside.id),
    firstName: 'Dorothy',
    lastName: 'Kim',
    contactMethod: 'center',
  })
  const harold = await findOrCreateSenior(payload, {
    center: String(hilltop.id),
    firstName: 'Harold',
    lastName: 'Brooks',
    contactMethod: 'cell',
    contact: '619-555-0177',
  })

  const eventTicket = await payload.create({
    collection: 'tickets',
    data: {
      senior: margaret,
      seniorName: 'Margaret Chen',
      issue: 'Cannot connect iPad to the center Wi-Fi.',
      device: 'tablet',
      center: lakeside.id,
      event: techThursday.id,
      scheduledAt: startsAt.toISOString(),
      assignedStudent: alex.id,
      status: 'assigned',
      createdBy: maria.id,
    },
  })

  await payload.create({
    collection: 'tickets',
    data: {
      senior: robert,
      seniorName: 'Robert Alvarez',
      issue: 'Phone is full of pop-up ads and running slowly.',
      device: 'phone',
      center: lakeside.id,
      event: techThursday.id,
      scheduledAt: startsAt.toISOString(),
      status: 'open',
      createdBy: maria.id,
    },
  })

  await payload.create({
    collection: 'tickets',
    data: {
      senior: dorothy,
      seniorName: 'Dorothy Kim',
      issue: 'Home printer will not connect to the laptop.',
      device: 'computer',
      center: lakeside.id,
      status: 'open',
      createdBy: maria.id,
    },
  })

  await payload.create({
    collection: 'tickets',
    data: {
      senior: harold,
      seniorName: 'Harold Brooks',
      issue: 'Needs help setting up a new TV streaming app.',
      device: 'tv',
      center: hilltop.id,
      status: 'open',
    },
  })

  const followUp = await payload.create({
    collection: 'tickets',
    data: {
      senior: margaret,
      seniorName: 'Margaret Chen',
      issue: 'Wanted the email site bookmarked after the Wi-Fi was fixed.',
      device: 'tablet',
      center: lakeside.id,
      assignedStudent: alex.id,
      status: 'assigned',
      createdBy: maria.id,
    },
  })
  await payload.update({
    collection: 'tickets',
    id: followUp.id,
    data: { status: 'completed' },
  })

  await payload.create({
    collection: 'hour-logs',
    data: {
      student: alex.id,
      hours: 1.5,
      date: new Date().toISOString(),
      notes: 'Helped Margaret get on the center Wi-Fi and bookmark the email site.',
      ticket: eventTicket.id,
      event: techThursday.id,
    },
  })

  payload.logger.info('Seed complete. Staff admin: admin@example.com / changeme')
  payload.logger.info('Student app: alex@student.edu / changeme')
}
