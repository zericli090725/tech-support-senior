import { TicketNoteForm } from '@/app/(frontend)/components/TicketNoteForm'
import { StatusBadge } from '@/app/(frontend)/components/StatusBadge'
import { formatDateTime } from '@/lib/format'
import type { TicketNote } from '@/payload-types'

type Props = {
  notes: TicketNote[]
  ticketId: string
  status: string
  canAdd?: boolean
  releaseOnOpen?: boolean
}

export function TicketNotes({ notes, ticketId, status, canAdd, releaseOnOpen }: Props) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-2xl">Notes</h2>
      {notes.length === 0 ? (
        <p className="leading-relaxed text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {notes.map((note) => (
            <li className="flex flex-col gap-1" key={note.id}>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{note.authorName}</span>
                <span>{formatDateTime(note.createdAt)}</span>
                {note.status ? <StatusBadge status={note.status} /> : null}
              </div>
              <p className="leading-relaxed">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
      {canAdd ? (
        <TicketNoteForm
          key={`${status}-${notes.length}`}
          ticketId={ticketId}
          status={status}
          releaseOnOpen={releaseOnOpen}
        />
      ) : null}
    </section>
  )
}
