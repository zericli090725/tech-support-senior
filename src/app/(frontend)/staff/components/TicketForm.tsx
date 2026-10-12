'use client'

import { useActionState, useEffect, useState } from 'react'

import { saveTicket } from '@/app/(frontend)/actions/staff'
import { stampLocalDateTimes, toDateTimeLocal } from '@/app/(frontend)/staff/components/dates'
import { SelectField, TextareaField, TextField } from '@/app/(frontend)/staff/components/fields'
import type { Choice, ScopedChoice } from '@/app/(frontend)/staff/options'
import { Button } from '@/components/ui/button'
import { deviceLabels } from '@/lib/format'
import type { ActionState } from '@/lib/errors'

type Defaults = {
  id?: string
  seniorId?: string
  seniorName?: string
  seniorNotes?: string | null
  issue?: string
  device?: string | null
  centerId?: string
  eventId?: string
  scheduledAt?: string | null
  assignedStudentId?: string
  status?: string
}

type Props = {
  centers: Choice[]
  seniors: ScopedChoice[]
  events: ScopedChoice[]
  students: ScopedChoice[]
  lockCenterId?: string
  centerLabel?: string
  defaults?: Defaults
  submitLabel: string
}

const statuses = [
  ['open', 'Open'],
  ['assigned', 'Assigned'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
] as const

export function TicketForm({
  centers,
  seniors,
  events,
  students,
  lockCenterId,
  centerLabel,
  defaults,
  submitLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      stampLocalDateTimes(formData, ['scheduledAt'])
      return saveTicket(prev, formData)
    },
    null,
  )
  const [centerId, setCenterId] = useState(lockCenterId || defaults?.centerId || '')
  const [seniorId, setSeniorId] = useState(defaults?.seniorId || '')
  const [addingSenior, setAddingSenior] = useState(false)
  const [contactMethod, setContactMethod] = useState('center')
  const [eventId, setEventId] = useState(defaults?.eventId || '')
  const [studentId, setStudentId] = useState(defaults?.assignedStudentId || '')
  const [scheduledAt, setScheduledAt] = useState('')
  const [ready, setReady] = useState(!defaults?.scheduledAt)

  useEffect(() => {
    if (defaults?.scheduledAt) setScheduledAt(toDateTimeLocal(defaults.scheduledAt))
    setReady(true)
  }, [defaults?.scheduledAt])

  const eventOptions = centerId ? events.filter((event) => event.centerId === centerId) : []
  const studentOptions = centerId ? students.filter((student) => student.centerId === centerId) : []
  const seniorOptions = centerId ? seniors.filter((senior) => senior.centerId === centerId) : []
  const showNameField = Boolean(defaults?.id) && !seniorId && !addingSenior

  function onCenterChange(next: string) {
    setCenterId(next)
    setSeniorId((current) =>
      seniors.some((senior) => senior.id === current && senior.centerId === next) ? current : '',
    )
    setEventId((current) =>
      events.some((event) => event.id === current && event.centerId === next) ? current : '',
    )
    setStudentId((current) =>
      students.some((student) => student.id === current && student.centerId === next) ? current : '',
    )
  }

  function onSeniorChange(next: string) {
    if (next === '__new__') {
      setAddingSenior(true)
      setSeniorId('')
      return
    }
    setAddingSenior(false)
    setSeniorId(next)
  }

  return (
    <form className="flex flex-col gap-4" action={formAction}>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      {lockCenterId ? (
        <>
          <input type="hidden" name="center" value={lockCenterId} />
          <p className="text-muted-foreground">Center: {centerLabel || 'Your center'}</p>
        </>
      ) : (
        <SelectField
          label="Center"
          name="center"
          required
          value={centerId}
          onChange={(event) => onCenterChange(event.target.value)}
        >
          <option value="">Choose a center</option>
          {centers.map((center) => (
            <option key={center.id} value={center.id}>
              {center.label}
            </option>
          ))}
        </SelectField>
      )}
      <SelectField
        label="Senior profile"
        name={addingSenior ? undefined : 'senior'}
        value={addingSenior ? '__new__' : seniorId}
        onChange={(event) => onSeniorChange(event.target.value)}
      >
        <option value="">{defaults?.id ? 'Not linked yet' : 'Choose a profile'}</option>
        <option value="__new__">Add a new senior</option>
        {seniorId && !seniorOptions.some((senior) => senior.id === seniorId) ? (
          <option value={seniorId}>{defaults?.seniorName || 'Selected senior'}</option>
        ) : null}
        {seniorOptions.map((senior) => (
          <option key={senior.id} value={senior.id}>
            {senior.label}
          </option>
        ))}
      </SelectField>
      {addingSenior ? (
        <>
          <input type="hidden" name="newSenior" value="1" />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="First name" name="firstName" required />
            <TextField label="Last name" name="lastName" required />
          </div>
          <SelectField
            label="How to reach them"
            name="contactMethod"
            value={contactMethod}
            onChange={(event) => setContactMethod(event.target.value)}
          >
            <option value="cell">Cell</option>
            <option value="email">Email</option>
            <option value="center">Through the center</option>
          </SelectField>
          {contactMethod === 'center' ? (
            <p className="text-muted-foreground">Staff will reach this senior through the center.</p>
          ) : (
            <TextField
              label={contactMethod === 'email' ? 'Email' : 'Cell number'}
              name="contact"
              type={contactMethod === 'email' ? 'email' : 'tel'}
              required
              autoComplete={contactMethod === 'email' ? 'email' : 'tel'}
            />
          )}
        </>
      ) : null}
      {showNameField ? (
        <TextField label="Senior name" name="seniorName" required defaultValue={defaults?.seniorName || ''} />
      ) : null}
      <p className="text-muted-foreground">Link a profile to keep this senior’s tickets together.</p>
      <TextareaField label="Issue" name="issue" rows={4} required defaultValue={defaults?.issue || ''} />
      <TextareaField
        label="Notes for the volunteer"
        name="seniorNotes"
        rows={3}
        defaultValue={defaults?.seniorNotes || ''}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Device" name="device" defaultValue={defaults?.device || ''}>
          <option value="">Not specified</option>
          {Object.entries(deviceLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Status" name="status" defaultValue={defaults?.status || 'open'}>
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
      </div>
      <TextField
        label="Appointment time"
        name="scheduledAt"
        type="datetime-local"
        value={scheduledAt}
        onChange={(event) => setScheduledAt(event.target.value)}
      />
      <SelectField label="Linked event" name="event" value={eventId} onChange={(event) => setEventId(event.target.value)}>
        <option value="">None</option>
        {eventOptions.map((event) => (
          <option key={event.id} value={event.id}>
            {event.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Assigned student"
        name="assignedStudent"
        value={studentId}
        onChange={(event) => setStudentId(event.target.value)}
      >
        <option value="">Unassigned — a student can claim it</option>
        {studentOptions.map((student) => (
          <option key={`${student.centerId}-${student.id}`} value={student.id}>
            {student.label}
          </option>
        ))}
      </SelectField>
      <p className="text-muted-foreground">Only approved volunteers at this center can be assigned.</p>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending || !ready}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
