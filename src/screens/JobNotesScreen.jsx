import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { relativeTime } from '../lib/format'

// Handover notes: where the last person got to, in their words.
//
// The change log says a task went to 75%. It cannot say "the ceiling grid
// isn't in yet so I've left the last two rows", which is the thing the next
// person actually needs. Those are different jobs and this is the second
// one.
//
// A list, not one editable field. A single field is something two people
// overwrite, and "what did Ben say last week" is exactly the question a note
// is for.
const LIMIT = 280

export default function JobNotesScreen({ job, onAddNote, saving }) {
  const [text, setText] = useState('')
  const notes = job.notes ?? []
  const remaining = LIMIT - text.length

  function submit(event) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAddNote(trimmed)
    setText('')
  }

  return (
    <>
      <form onSubmit={submit} className="card mb-5 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, LIMIT))}
          rows={3}
          placeholder="Where did you get to? What should the next person know?"
          className="w-full resize-none bg-transparent text-[16px] leading-snug outline-none placeholder:text-[color:var(--text-muted)]"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          {/* The count only appears when it starts to matter — a character
              counter sitting there from the first keystroke reads as a
              telling-off. */}
          <span className="text-[12px] text-[color:var(--text-muted)]">
            {remaining < 60 ? `${remaining} left` : ''}
          </span>
          <button
            type="submit"
            disabled={!text.trim() || saving}
            className="tap pressable rounded-[var(--radius-control)] bg-[color:var(--brand-green)] px-5 text-[15px] font-medium text-[color:var(--brand-green-ink)] disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Add note'}
          </button>
        </div>
      </form>

      {/* No authentication, so anyone with the link can read this. Said here
          rather than only in a README, because this is the box someone would
          otherwise type a client's phone number into. */}
      <p className="mb-4 text-[12px] leading-relaxed text-[color:var(--text-muted)]">
        Everyone on this job sees these. Keep client details out of them.
      </p>

      {notes.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No notes yet"
          body="The first one is usually the most useful."
        />
      ) : (
        <ul className="card overflow-hidden">
          {notes.map((note, i) => (
            <li
              key={`${note.at}-${i}`}
              className="border-b border-[color:var(--border)] px-4 py-3 last:border-b-0"
            >
              <p className="text-[15px] leading-snug">{note.text}</p>
              <p className="mt-1 text-[12px] text-[color:var(--text-muted)]">
                {note.by} · {relativeTime(note.at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
