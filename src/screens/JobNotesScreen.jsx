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
//
// THREE PROMPTS RATHER THAN ONE EMPTY BOX. An empty box asks you to decide
// what is worth writing while you are packing up a van, and the honest
// answer at that moment is usually "nothing". A prompt has already made that
// decision. The three are borrowed from the debrief step in commercial field
// service apps — problem, cause, fix — reworded for install work, where the
// question is not what broke but where you got to.
//
// Only the first is required. Making all three mandatory turns a note into a
// form, and a form on a phone at 4pm gets one-word answers.
const PROMPTS = [
  {
    key: 'did',
    label: 'What did you get done?',
    // Prefixed "e.g." because the examples are long enough to read as
    // already-typed answers, and a form that looks pre-filled gets submitted
    // empty. Colour alone does not carry it: the secondary ink is a
    // deliberately high-contrast grey, so it has to be said in words.
    placeholder: 'e.g. Rough-in done on level 2, bar the last two rows',
    required: true,
  },
  {
    key: 'blocked',
    label: "What's in the way?",
    placeholder: 'e.g. Ceiling grid still not in',
  },
  {
    key: 'next',
    label: 'What should the next person do first?',
    placeholder: 'e.g. Start on the east side, the gear is there',
  },
]

// 160 each rather than one 280 field. Three of these is 480 characters, and
// fifty notes is roughly 24KB — comfortable beside the tasks and the change
// log inside the Worker's 100,000-character limit on a value.
const LIMIT = 160

export default function JobNotesScreen({ job, onAddNote, saving }) {
  const [values, setValues] = useState({ did: '', blocked: '', next: '' })
  const notes = job.notes ?? []
  const canSubmit = values.did.trim().length > 0

  function set(key, value) {
    setValues((prev) => ({ ...prev, [key]: value.slice(0, LIMIT) }))
  }

  function submit(event) {
    event.preventDefault()
    if (!canSubmit) return
    const fields = Object.fromEntries(
      PROMPTS.map(({ key }) => [key, values[key].trim()]).filter(([, v]) => v),
    )
    // A composed plain-text version travels with the fields, because it is
    // what the job screen's preview reads and what every note written before
    // this change looks like. Same reason the record keeps both.
    const text = PROMPTS.filter(({ key }) => fields[key])
      .map(({ label, key }) => `${label} ${fields[key]}`)
      .join('\n')
    onAddNote(text, fields)
    setValues({ did: '', blocked: '', next: '' })
  }

  return (
    <>
      <form onSubmit={submit} className="card mb-6 p-4">
        {PROMPTS.map(({ key, label, placeholder, required }, i) => {
          const remaining = LIMIT - values[key].length
          return (
            <div key={key} className={i > 0 ? 'mt-4 border-t border-line pt-4' : undefined}>
              <label htmlFor={`note-${key}`} className="block text-xs font-medium">
                {label}
                {/* The optional ones say so. Two unmarked empty boxes under a
                    required one read as three required boxes, and the person
                    who only has an answer to the first one gives up. */}
                {!required && <span className="ml-1 font-normal text-ink-2">Optional</span>}
              </label>
              <textarea
                id={`note-${key}`}
                value={values[key]}
                onChange={(e) => set(key, e.target.value)}
                rows={2}
                placeholder={placeholder}
                className="mt-1 w-full resize-none bg-transparent text-sm leading-snug outline-none placeholder:text-ink-2"
              />
              {/* The count only appears when it starts to matter — a character
                  counter sitting there from the first keystroke reads as a
                  telling-off. */}
              {remaining < 40 && <p className="text-xs text-ink-2">{remaining} left</p>}
            </div>
          )
        })}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="tap pressable rounded-sm bg-accent px-4 text-sm font-medium text-accent-ink disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Add note'}
          </button>
        </div>
      </form>

      {/* No authentication, so anyone with the link can read this. Said here
          rather than only in a README, because these are the boxes someone
          would otherwise type a client's phone number into. */}
      <p className="mb-4 text-xs leading-relaxed text-ink-2">
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
              className="border-b border-line px-4 py-4 last:border-b-0"
            >
              {/* Notes written before the prompts existed have no fields and
                  render as the plain paragraph they always were. Dropping
                  them because the form changed would be the worse bug. */}
              {note.fields ? (
                <dl>
                  {PROMPTS.filter(({ key }) => note.fields[key]).map(({ key, label }) => (
                    <div key={key} className="mt-2 first:mt-0">
                      <dt className="text-xs text-ink-2">{label}</dt>
                      <dd className="text-sm leading-snug">{note.fields[key]}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="whitespace-pre-line text-sm leading-snug">{note.text}</p>
              )}
              <p className="mt-2 text-xs text-ink-2">
                {note.by} · {relativeTime(note.at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
