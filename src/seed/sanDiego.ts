import type { Payload } from 'payload'

import { getRelationID } from '@/lib/getRelationID'
import { splitSeniorName, type SeniorContactMethod } from '@/lib/seniors'

import { findOrCreateSenior } from './seniorProfiles'

function contactFor(name: string, index: number): { contactMethod: SeniorContactMethod; contact?: string } {
  const mode = index % 3
  if (mode === 0) return { contactMethod: 'cell', contact: `619-555-${String(1200 + index).padStart(4, '0').slice(-4)}` }
  if (mode === 1) {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z]+/g, '.')
      .replace(/^\.|\.$/g, '')
    return { contactMethod: 'email', contact: `${slug}@example.com` }
  }
  return { contactMethod: 'center' }
}

const PASSWORD = 'changeme'

type Device = 'phone' | 'tablet' | 'computer' | 'tv' | 'other'
type TicketStatus = 'open' | 'assigned' | 'completed' | 'cancelled'
type MembershipStatus = 'pending' | 'approved' | 'rejected'

type WithId = { id: string }

const centers = [
  {
    key: 'west',
    name: 'Gary and Mary West Senior Wellness Center',
    address: '1525 4th Ave, San Diego, CA 92101',
    notes: 'Downtown. Check in at the front desk. Tech help meets in the community room.',
  },
  {
    key: 'peninsula',
    name: 'Peninsula Community Senior Center',
    address: '1475 Catalina Blvd, San Diego, CA 92107',
    notes: 'Point Loma. Formerly the Peninsula Shepherd Center. Sessions use the activity room.',
  },
  {
    key: 'miraMesa',
    name: 'Mira Mesa Senior Center',
    address: '8460 Mira Mesa Blvd, San Diego, CA 92126',
    notes: 'Also called the Verne Goodwin Mira Mesa Senior Center. Appointments are one-on-one.',
  },
  {
    key: 'bayTerraces',
    name: 'Bay Terraces Community & Senior Center',
    address: '7445 Tooma Street, San Diego, CA 92139',
    notes: 'Southeast San Diego. Group sessions use the multipurpose room.',
  },
  {
    key: 'edBrown',
    name: 'Ed Brown Senior Center at Rancho Bernardo',
    address: '18402 W Bernardo Drive, San Diego, CA 92127',
    notes: 'Rancho Bernardo. Workshops meet in the classroom.',
  },
  {
    key: 'deLaCruz',
    name: 'Park de la Cruz Community Center',
    address: '3901 Landis St, San Diego, CA 92105',
    notes: 'City Heights. Bilingual help is welcome. Sessions use the community room.',
  },
  {
    key: 'stevens',
    name: 'George L. Stevens Senior Center',
    address: '570 S. 65th Street, San Diego, CA 92114',
    notes: 'Encanto / Lincoln Park. Home of the Fourth District Seniors Resource Center. Computer area is down the hall from the front desk.',
  },
  {
    key: 'seltz',
    name: 'Judith L. Seltz Senior Wellness Center',
    address: '5257 Mt. Etna Drive, San Diego, CA 92117',
    notes: 'Clairemont. Volunteers are signing up, and senior appointments have not been scheduled yet.',
  },
] as const

const staff = [
  { key: 'west', name: 'Angela Ruiz', email: 'angela.ruiz@sdcenters.example' },
  { key: 'peninsula', name: 'Ben Carter', email: 'ben.carter@sdcenters.example' },
  { key: 'miraMesa', name: 'Chloe Tran', email: 'chloe.tran@sdcenters.example' },
  { key: 'bayTerraces', name: 'David Okonkwo', email: 'david.okonkwo@sdcenters.example' },
  { key: 'edBrown', name: 'Erica Walsh', email: 'erica.walsh@sdcenters.example' },
  { key: 'deLaCruz', name: 'Felix Mendoza', email: 'felix.mendoza@sdcenters.example' },
  { key: 'stevens', name: 'Gina Brooks', email: 'gina.brooks@sdcenters.example' },
  { key: 'seltz', name: 'Henry Cho', email: 'henry.cho@sdcenters.example' },
] as const

const students = [
  { key: 'priya', name: 'Priya Shah', email: 'priya.shah@student.edu' },
  { key: 'diego', name: 'Diego Morales', email: 'diego.morales@student.edu' },
  { key: 'hannah', name: 'Hannah Cho', email: 'hannah.cho@student.edu' },
  { key: 'noah', name: 'Noah Brooks', email: 'noah.brooks@student.edu' },
  { key: 'aisha', name: 'Aisha Rahman', email: 'aisha.rahman@student.edu' },
  { key: 'liam', name: 'Liam Nguyen', email: 'liam.nguyen@student.edu' },
  { key: 'sofia', name: 'Sofia Alvarez', email: 'sofia.alvarez@student.edu' },
  { key: 'ethan', name: 'Ethan Park', email: 'ethan.park@student.edu' },
  { key: 'maya', name: 'Maya Johnson', email: 'maya.johnson@student.edu' },
  { key: 'caleb', name: 'Caleb Ortiz', email: 'caleb.ortiz@student.edu' },
  { key: 'grace', name: 'Grace Kim', email: 'grace.kim@student.edu' },
  { key: 'omar', name: 'Omar Hassan', email: 'omar.hassan@student.edu' },
  { key: 'elena', name: 'Elena Vasquez', email: 'elena.vasquez@student.edu' },
  { key: 'jordan', name: 'Jordan Blake', email: 'jordan.blake@student.edu' },
  { key: 'riley', name: 'Riley Chen', email: 'riley.chen@student.edu' },
  { key: 'fatima', name: 'Fatima Diallo', email: 'fatima.diallo@student.edu' },
] as const

const memberships: { student: string; center: string; status: MembershipStatus }[] = [
  { student: 'priya', center: 'west', status: 'approved' },
  { student: 'priya', center: 'peninsula', status: 'approved' },
  { student: 'diego', center: 'west', status: 'approved' },
  { student: 'hannah', center: 'west', status: 'pending' },
  { student: 'noah', center: 'peninsula', status: 'approved' },
  { student: 'fatima', center: 'peninsula', status: 'approved' },
  { student: 'fatima', center: 'stevens', status: 'rejected' },
  { student: 'aisha', center: 'stevens', status: 'approved' },
  { student: 'liam', center: 'stevens', status: 'approved' },
  { student: 'liam', center: 'miraMesa', status: 'pending' },
  { student: 'sofia', center: 'miraMesa', status: 'approved' },
  { student: 'ethan', center: 'bayTerraces', status: 'approved' },
  { student: 'maya', center: 'bayTerraces', status: 'approved' },
  { student: 'caleb', center: 'edBrown', status: 'approved' },
  { student: 'grace', center: 'edBrown', status: 'pending' },
  { student: 'omar', center: 'deLaCruz', status: 'approved' },
  { student: 'elena', center: 'deLaCruz', status: 'approved' },
  { student: 'elena', center: 'west', status: 'approved' },
  { student: 'jordan', center: 'seltz', status: 'approved' },
  { student: 'riley', center: 'seltz', status: 'pending' },
]

const events = [
  {
    key: 'westClinic',
    title: 'Phone and Tablet Clinic',
    center: 'west',
    daysFromNow: 8,
    hour: 10,
    durationHours: 2,
    locationInCenter: 'Community room',
    maxStudents: 10,
    description: 'Drop-in help with phones and tablets. Students pair with a senior for the morning.',
  },
  {
    key: 'westPast',
    title: 'Device Check-in',
    center: 'west',
    daysFromNow: -12,
    hour: 10,
    durationHours: 2,
    locationInCenter: 'Community room',
    maxStudents: 10,
    description: 'Earlier device check-in. A few seniors still have follow-up notes on their tickets.',
  },
  {
    key: 'peninsulaWifi',
    title: 'Wi-Fi and Printer Help',
    center: 'peninsula',
    daysFromNow: 5,
    hour: 9,
    minute: 30,
    durationHours: 2,
    locationInCenter: 'Activity room',
    maxStudents: 10,
    description: 'Home Wi-Fi, printers, and getting a laptop back online.',
  },
  {
    key: 'stevensComputers',
    title: 'Computer Basics',
    center: 'stevens',
    daysFromNow: 11,
    hour: 13,
    durationHours: 2,
    locationInCenter: 'Computer area',
    maxStudents: 10,
    description: 'Email, Zoom, and finding files on a laptop.',
  },
  {
    key: 'bayTv',
    title: 'Streaming and TV Setup',
    center: 'bayTerraces',
    daysFromNow: 16,
    hour: 10,
    durationHours: 2,
    locationInCenter: 'Multipurpose room',
    maxStudents: 10,
    description: 'Smart TVs, streaming sticks, and the remotes that go with them.',
  },
  {
    key: 'edBrownPhotos',
    title: 'Smartphone Photo Workshop',
    center: 'edBrown',
    daysFromNow: 9,
    hour: 9,
    durationHours: 2,
    locationInCenter: 'Classroom',
    maxStudents: 10,
    description: 'Taking, finding, and sending photos without filling the phone.',
  },
  {
    key: 'deLaCruzBilingual',
    title: 'Bilingual Tech Help',
    center: 'deLaCruz',
    daysFromNow: 13,
    hour: 11,
    durationHours: 2,
    locationInCenter: 'Community room',
    maxStudents: 10,
    description: 'Phones, video calls, and language settings. Spanish and English both welcome.',
  },
] as const

const rsvps: { event: string; student: string }[] = [
  { event: 'westClinic', student: 'priya' },
  { event: 'westClinic', student: 'diego' },
  { event: 'westClinic', student: 'elena' },
  { event: 'westPast', student: 'diego' },
  { event: 'peninsulaWifi', student: 'noah' },
  { event: 'peninsulaWifi', student: 'priya' },
  { event: 'peninsulaWifi', student: 'fatima' },
  { event: 'stevensComputers', student: 'aisha' },
  { event: 'stevensComputers', student: 'liam' },
  { event: 'bayTv', student: 'ethan' },
  { event: 'bayTv', student: 'maya' },
  { event: 'edBrownPhotos', student: 'caleb' },
  { event: 'deLaCruzBilingual', student: 'omar' },
  { event: 'deLaCruzBilingual', student: 'elena' },
]

const tickets: {
  seniorName: string
  issue: string
  device: Device
  center: string
  event?: string
  student?: string
  status: TicketStatus
  daysFromNow?: number
  hour?: number
  seniorNotes?: string
}[] = [
  {
    seniorName: 'Helen Nakamura',
    issue: 'iPad will not stay connected to the center Wi-Fi.',
    device: 'tablet',
    center: 'west',
    event: 'westClinic',
    status: 'open',
    seniorNotes: 'Uses a larger font. Her daughter set up the iPad.',
  },
  {
    seniorName: 'Frank DiMaggio',
    issue: 'Wants photos of his grandchildren off an old Android phone.',
    device: 'phone',
    center: 'west',
    event: 'westClinic',
    student: 'priya',
    status: 'assigned',
  },
  {
    seniorName: 'Ruth Goldstein',
    issue: 'Forgot the password for her email and cannot sign in on the laptop.',
    device: 'computer',
    center: 'west',
    event: 'westPast',
    student: 'diego',
    status: 'completed',
  },
  {
    seniorName: 'Arthur Bell',
    issue: 'Browser is full of pop-up ads and extra toolbars.',
    device: 'computer',
    center: 'west',
    status: 'open',
    daysFromNow: 3,
    hour: 14,
  },
  {
    seniorName: 'Carmen Reyes',
    issue: 'New smart TV. Needs a streaming app and the volume set so she can hear it.',
    device: 'tv',
    center: 'west',
    student: 'elena',
    status: 'assigned',
    daysFromNow: 4,
    hour: 11,
  },
  {
    seniorName: 'Walter Briggs',
    issue: 'Could not remember his phone passcode.',
    device: 'phone',
    center: 'west',
    status: 'cancelled',
    seniorNotes: 'Cancelled. His daughter helped him reset the passcode.',
  },
  {
    seniorName: 'Josephine Hale',
    issue: 'Hearing aids will not pair with her phone for calls.',
    device: 'phone',
    center: 'peninsula',
    event: 'peninsulaWifi',
    status: 'open',
  },
  {
    seniorName: 'George Okada',
    issue: 'Home printer shows offline when he tries to print from the laptop.',
    device: 'computer',
    center: 'peninsula',
    event: 'peninsulaWifi',
    student: 'noah',
    status: 'assigned',
  },
  {
    seniorName: 'Betty Lang',
    issue: 'iPad notifications are constant and she cannot find the Mail app.',
    device: 'tablet',
    center: 'peninsula',
    status: 'open',
    daysFromNow: 6,
    hour: 10,
  },
  {
    seniorName: 'Harold Stein',
    issue: 'Wants larger text on his phone and the magnifier turned on.',
    device: 'other',
    center: 'peninsula',
    student: 'priya',
    status: 'completed',
    seniorNotes: 'Also uses a flip-phone style case. Keep the home screen to four icons.',
  },
  {
    seniorName: 'Dorothy Feldman',
    issue: 'Needs Zoom installed for a weekly book club.',
    device: 'computer',
    center: 'stevens',
    event: 'stevensComputers',
    status: 'open',
  },
  {
    seniorName: 'Samuel Wright',
    issue: 'Phone storage is full and photos will not send.',
    device: 'phone',
    center: 'stevens',
    event: 'stevensComputers',
    student: 'aisha',
    status: 'assigned',
  },
  {
    seniorName: 'Patricia Nguyen',
    issue: 'New tablet from her son. She only wants email and a news app.',
    device: 'tablet',
    center: 'stevens',
    status: 'open',
    daysFromNow: 2,
    hour: 15,
  },
  {
    seniorName: 'Louis Carter',
    issue: 'Laptop fan is loud and the screen looks too dim.',
    device: 'computer',
    center: 'stevens',
    status: 'open',
  },
  {
    seniorName: 'Irene Walsh',
    issue: 'Locked out of Facebook and is not sure which email she used.',
    device: 'phone',
    center: 'miraMesa',
    status: 'open',
    daysFromNow: 1,
    hour: 13,
  },
  {
    seniorName: 'Tomoko Sato',
    issue: 'Just got a tablet and wants to video-call her sister.',
    device: 'tablet',
    center: 'miraMesa',
    student: 'sofia',
    status: 'assigned',
  },
  {
    seniorName: 'Raymond Cole',
    issue: 'Cannot find old emails after the provider moved him to a new address.',
    device: 'computer',
    center: 'miraMesa',
    status: 'open',
  },
  {
    seniorName: 'Gloria Santos',
    issue: 'Wants the local news and PBS on her smart TV at home.',
    device: 'tv',
    center: 'bayTerraces',
    event: 'bayTv',
    status: 'open',
  },
  {
    seniorName: 'Henry Wallace',
    issue: 'Printer only works when the USB cable is plugged in.',
    device: 'computer',
    center: 'bayTerraces',
    event: 'bayTv',
    student: 'ethan',
    status: 'assigned',
  },
  {
    seniorName: 'Pearl Johnson',
    issue: 'Getting texts that say her bank account is locked.',
    device: 'phone',
    center: 'bayTerraces',
    status: 'open',
    seniorNotes: 'Treat the texts as a scam until proven otherwise. Do not open links.',
  },
  {
    seniorName: 'Vivian Brooks',
    issue: 'Downloaded too many games. Wants the tablet simple again.',
    device: 'tablet',
    center: 'bayTerraces',
    student: 'maya',
    status: 'completed',
  },
  {
    seniorName: 'Shirley Grant',
    issue: 'Wants to share photos in the family group chat without sending them one by one.',
    device: 'phone',
    center: 'edBrown',
    event: 'edBrownPhotos',
    status: 'open',
  },
  {
    seniorName: 'Martin Ellis',
    issue: 'Laptop has gotten slow and he is worried it has a virus.',
    device: 'computer',
    center: 'edBrown',
    event: 'edBrownPhotos',
    student: 'caleb',
    status: 'assigned',
  },
  {
    seniorName: 'June Porter',
    issue: 'Streaming stick remote does nothing when she presses the buttons.',
    device: 'tv',
    center: 'edBrown',
    status: 'open',
    daysFromNow: 7,
    hour: 11,
  },
  {
    seniorName: 'Rosa Mendoza',
    issue: 'Phone menus are in English. She wants them in Spanish, plus WhatsApp.',
    device: 'phone',
    center: 'deLaCruz',
    event: 'deLaCruzBilingual',
    student: 'omar',
    status: 'assigned',
    seniorNotes: 'Prefers Spanish. Her grandson can help translate if a student does not.',
  },
  {
    seniorName: 'Ernesto Cruz',
    issue: 'Video calls freeze after about a minute.',
    device: 'tablet',
    center: 'deLaCruz',
    event: 'deLaCruzBilingual',
    status: 'open',
  },
  {
    seniorName: 'Lillian Cho',
    issue: 'A benefits website keeps signing her out before she can submit the form.',
    device: 'computer',
    center: 'deLaCruz',
    status: 'open',
    daysFromNow: 4,
    hour: 10,
  },
]

const hourLogs: {
  student: string
  seniorName: string
  event?: string
  hours: number
  daysFromNow: number
  notes: string
}[] = [
  {
    student: 'diego',
    seniorName: 'Ruth Goldstein',
    event: 'westPast',
    hours: 1.5,
    daysFromNow: -12,
    notes: 'Reset Ruth Goldstein email password and signed her laptop into the mail site.',
  },
  {
    student: 'priya',
    seniorName: 'Harold Stein',
    hours: 1,
    daysFromNow: -3,
    notes: 'Turned on larger text and the magnifier for Harold Stein and simplified his home screen.',
  },
  {
    student: 'maya',
    seniorName: 'Vivian Brooks',
    hours: 2,
    daysFromNow: -5,
    notes: 'Removed extra games from Vivian Brooks tablet and left email, photos, and one news app.',
  },
]

function atLocal(daysFromNow: number, hour: number, minute = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString()
}

async function findOne(
  payload: Payload,
  collection: 'users' | 'students' | 'centers' | 'center-memberships' | 'events' | 'event-rsvps' | 'tickets' | 'hour-logs',
  where: Record<string, { equals: string | number }>,
): Promise<WithId | undefined> {
  const result = await payload.find({
    collection,
    where,
    limit: 1,
    depth: 0,
  })
  return result.docs[0] as WithId | undefined
}

export async function seedSanDiego(payload: Payload): Promise<void> {
  const marker = await findOne(payload, 'hour-logs', {
    notes: { equals: hourLogs[hourLogs.length - 1].notes },
  })
  if (marker) {
    payload.logger.info('San Diego seed already present, skipping.')
    return
  }

  payload.logger.info('Seeding San Diego centers, students, seniors, tickets, and events...')

  const centerDocs = new Map<string, WithId>()
  for (const center of centers) {
    const existing = await findOne(payload, 'centers', { name: { equals: center.name } })
    centerDocs.set(
      center.key,
      existing ||
        (await payload.create({
          collection: 'centers',
          data: {
            name: center.name,
            address: center.address,
            notes: center.notes,
          },
        })),
    )
  }

  const staffDocs = new Map<string, WithId>()
  for (const member of staff) {
    const existing = await findOne(payload, 'users', { email: { equals: member.email } })
    staffDocs.set(
      member.key,
      existing ||
        (await payload.create({
          collection: 'users',
          data: {
            name: member.name,
            email: member.email,
            password: PASSWORD,
            role: 'staff',
            center: centerDocs.get(member.key)!.id,
          },
        })),
    )
  }

  const studentDocs = new Map<string, WithId>()
  for (const student of students) {
    const existing = await findOne(payload, 'students', { email: { equals: student.email } })
    studentDocs.set(
      student.key,
      existing ||
        (await payload.create({
          collection: 'students',
          data: {
            name: student.name,
            email: student.email,
            password: PASSWORD,
          },
        })),
    )
  }

  for (const membership of memberships) {
    const student = studentDocs.get(membership.student)!.id
    const center = centerDocs.get(membership.center)!.id
    const existing = await payload.find({
      collection: 'center-memberships',
      where: {
        and: [{ student: { equals: student } }, { center: { equals: center } }],
      },
      limit: 1,
      depth: 0,
    })
    if (existing.totalDocs > 0) continue
    await payload.create({
      collection: 'center-memberships',
      data: {
        student,
        center,
        status: membership.status,
      },
    })
  }

  const eventDocs = new Map<string, WithId & { startsAt?: string }>()
  for (const event of events) {
    const center = centerDocs.get(event.center)!.id
    const existing = await payload.find({
      collection: 'events',
      where: {
        and: [{ title: { equals: event.title } }, { center: { equals: center } }],
      },
      limit: 1,
      depth: 0,
    })
    if (existing.docs[0]) {
      eventDocs.set(event.key, existing.docs[0] as WithId & { startsAt?: string })
      continue
    }
    const startsAt = atLocal(event.daysFromNow, event.hour, 'minute' in event ? event.minute : 0)
    const created = await payload.create({
      collection: 'events',
      data: {
        title: event.title,
        center,
        startsAt,
        endsAt: addHours(startsAt, event.durationHours),
        locationInCenter: event.locationInCenter,
        maxStudents: event.maxStudents,
        description: event.description,
        createdBy: staffDocs.get(event.center)!.id,
      },
    })
    eventDocs.set(event.key, created)
  }

  for (const rsvp of rsvps) {
    const event = eventDocs.get(rsvp.event)!.id
    const student = studentDocs.get(rsvp.student)!.id
    const existing = await payload.find({
      collection: 'event-rsvps',
      where: {
        and: [{ event: { equals: event } }, { student: { equals: student } }],
      },
      limit: 1,
      depth: 0,
    })
    if (existing.totalDocs > 0) continue
    await payload.create({
      collection: 'event-rsvps',
      data: {
        event,
        student,
        status: 'going',
      },
    })
  }

  const ticketDocs = new Map<string, WithId>()
  for (const [index, ticket] of tickets.entries()) {
    const center = String(centerDocs.get(ticket.center)!.id)
    const { firstName, lastName } = splitSeniorName(ticket.seniorName)
    const contact = contactFor(ticket.seniorName, index)
    const senior = await findOrCreateSenior(payload, {
      center,
      firstName,
      lastName,
      contactMethod: contact.contactMethod,
      contact: contact.contact,
    })
    const existing = await payload.find({
      collection: 'tickets',
      where: {
        and: [{ seniorName: { equals: ticket.seniorName } }, { center: { equals: center } }],
      },
      limit: 1,
      depth: 0,
    })
    let doc = existing.docs[0] as (WithId & { status?: string; senior?: unknown }) | undefined
    if (!doc) {
      const event = ticket.event ? eventDocs.get(ticket.event) : undefined
      const scheduledAt = event?.startsAt
        ? event.startsAt
        : ticket.daysFromNow != null
          ? atLocal(ticket.daysFromNow, ticket.hour ?? 10)
          : undefined
      doc = await payload.create({
        collection: 'tickets',
        data: {
          senior,
          seniorName: ticket.seniorName,
          seniorNotes: ticket.seniorNotes,
          issue: ticket.issue,
          device: ticket.device,
          center,
          event: event?.id,
          scheduledAt,
          assignedStudent: ticket.student ? studentDocs.get(ticket.student)!.id : undefined,
          status: ticket.status === 'completed' ? 'assigned' : ticket.status,
          createdBy: staffDocs.get(ticket.center)!.id,
        },
      })
    } else if (!getRelationID(doc.senior)) {
      doc = await payload.update({
        collection: 'tickets',
        id: doc.id,
        data: { senior },
      })
    }
    if (ticket.status === 'completed' && doc.status !== 'completed') {
      doc = await payload.update({
        collection: 'tickets',
        id: doc.id,
        data: { status: 'completed' },
      })
    }
    ticketDocs.set(ticket.seniorName, doc)
  }

  for (const log of hourLogs) {
    const existing = await findOne(payload, 'hour-logs', { notes: { equals: log.notes } })
    if (existing) continue
    await payload.create({
      collection: 'hour-logs',
      data: {
        student: studentDocs.get(log.student)!.id,
        hours: log.hours,
        date: atLocal(log.daysFromNow, 12),
        notes: log.notes,
        ticket: ticketDocs.get(log.seniorName)!.id,
        event: log.event ? eventDocs.get(log.event)!.id : undefined,
      },
    })
  }

  payload.logger.info(
    `San Diego seed complete. ${students.length} students and ${staff.length} center staff use password ${PASSWORD}. Example student: priya.shah@student.edu`,
  )
}
