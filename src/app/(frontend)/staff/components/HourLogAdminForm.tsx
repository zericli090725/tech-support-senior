'use client'

import { useActionState, useEffect, useState } from 'react'

import { saveHourLog } from '@/app/(frontend)/actions/staff'
import { todayDateInput } from '@/app/(frontend)/staff/components/dates'
import { SelectField, TextareaField, TextField } from '@/app/(frontend)/staff/components/fields'
import type { Choice, HourEventChoice, HourTicketChoice } from '@/app/(frontend)/staff/options'
import { Button } from '@/components/ui/button'
import type { ActionState } from '@/lib/errors'

type Defaults = {
  id?: string
  studentId?: string
  hours?: number
  date?: string
  notes?: string | null
  ticketId?: string
  eventId?: string
}

type Props = {
  students: Choice[]
  tickets: HourTicketChoice[]
  events: HourEventChoice[]
  defaults?: Defaults
  submitLabel: string
}

export function HourLogAdminForm({ students, tickets, events, defaults, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(
    saveHourLog as (state: ActionState, formData: FormData) => Promise<ActionState>,
    null,
  )
  const [studentId, setStudentId] = useState(defaults?.studentId || '')
  const [ticketId, setTicketId] = useState(defaults?.ticketId || '')
  const [eventId, setEventId] = useState(defaults?.eventId || '')
  const [date, setDate] = useState(defaults?.date || '')

  useEffect(() => {
    if (!defaults?.date) setDate(todayDateInput())
  }, [defaults?.date])

  const ticketOptions = studentId ? tickets.filter((ticket) => ticket.studentId === studentId) : []
  const eventOptions = studentId ? events.filter((event) => event.studentIds.includes(studentId)) : []

  function onStudentChange(next: string) {
    setStudentId(next)
    setTicketId((current) =>
      tickets.some((ticket) => ticket.id === current && ticket.studentId === next) ? current : '',
    )
    setEventId((current) =>
      events.some((event) => event.id === current && event.studentIds.includes(next)) ? current : '',
    )
  }

  return (
    <form className="flex flex-col gap-4" action={formAction}>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <SelectField
        label="Student"
        name="student"
        required
        value={studentId}
        onChange={(event) => onStudentChange(event.target.value)}
      >
        <option value="">Choose a student</option>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.label}
          </option>
        ))}
      </SelectField>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Hours"
          name="hours"
          type="number"
          min={0.25}
          max={24}
          step={0.25}
          required
          defaultValue={defaults?.hours ?? 1}
        />
        <TextField
          label="Date"
          name="date"
          type="date"
          required
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      <SelectField label="Linked ticket" name="ticket" value={ticketId} onChange={(event) => setTicketId(event.target.value)}>
        <option value="">None</option>
        {ticketOptions.map((ticket) => (
          <option key={ticket.id} value={ticket.id}>
            {ticket.label}
          </option>
        ))}
      </SelectField>
      <SelectField label="Linked event" name="event" value={eventId} onChange={(event) => setEventId(event.target.value)}>
        <option value="">None</option>
        {eventOptions.map((event) => (
          <option key={event.id} value={event.id}>
            {event.label}
          </option>
        ))}
      </SelectField>
      <p className="text-muted-foreground">
        Tickets must be assigned to that student. Events must be ones they RSVPed to.
      </p>
      <TextareaField label="Notes" name="notes" rows={3} defaultValue={defaults?.notes || ''} />
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending || !date}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
