import { Camera, StickyNote } from 'lucide-react'
import PercentChips from '../components/PercentChips'
import ProgressBar from '../components/ProgressBar'
import TaskStatus from '../components/TaskStatus'
import { relativeTime } from '../lib/format'

// The screen the demo lives or dies on. Top to bottom: what it is, what it
// is at, how to change it, then the extras. The primary control sits in the
// bottom two-thirds where a thumb reaches without shifting grip.
export default function TaskDetailScreen({ task, position, total, history = [], onSetPercent, onToggleNa, onAttachPhoto, onOpenNotes }) {
  return (
    <>
      <p className="text-xs text-ink-2">
        Task {position} of {total} · {task.area}
      </p>
      <h2 className="mt-1 text-lg font-medium leading-snug">{task.name}</h2>

      {/* A ring rather than a bare number. The screen needed one thing the eye
          lands on first — at arm's length in sun a figure floating in space
          reads as text among text, where a filled arc is a shape you take in
          before you read anything. */}
      {/* The figure, at the size of the thing it is. This screen exists to
          show and change one number; putting it at 76px and giving it the
          top of the screen says so, and it is the only element here that
          can be read from a ladder without bringing the phone closer. */}
      <div className="my-6">
        {task.na ? (
          <div className="py-4">
            <p className="text-lg font-medium text-ink-2">Not applicable</p>
            <p className="mt-1 text-sm text-ink-2">
              Excluded from this job&apos;s percentage
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-4 pb-4">
              <span className="figure text-3xl">
                {typeof task.pct === 'number' ? task.pct : 0}
                <span className="text-xl text-ink-2">%</span>
              </span>
              <TaskStatus task={task} showLabel />
            </div>
            <ProgressBar pct={typeof task.pct === 'number' ? task.pct : 0} />
          </>
        )}
        {task.updatedBy && !task.na && (
          <p className="mt-2 text-xs text-ink-2">
            Set by {task.updatedBy}, {relativeTime(task.updatedAt)}
          </p>
        )}
      </div>

      <PercentChips value={task.na ? null : task.pct} onChange={onSetPercent} disabled={task.na} />

      <button
        onClick={onToggleNa}
        className="tap mt-4 flex w-full items-center justify-center rounded-sm border border-line text-sm text-ink-2"
      >
        {task.na ? 'This job does need it' : "Doesn't apply to this job"}
      </button>

      <div className="mt-8 border-t border-line pt-6">
        {task.attachments.length > 0 && (
          <ul className="mb-2 flex flex-col gap-2">
            {task.attachments.map((a) => (
              <li key={a.id}>
                {a.kind === 'photo' ? (
                  <img
                    src={a.src}
                    alt="Site photo"
                    className="max-h-56 w-full rounded-sm object-cover"
                  />
                ) : (
                  <p className="rounded-sm bg-surface-2 px-4 py-2 text-xs text-ink-2">
                    {a.text}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-2 gap-2">
          {/* A real capture, not a placeholder. `capture="environment"` asks
              for the rear camera directly, so on a phone this opens the
              camera rather than a file browser — which is the difference
              between a demo people believe and one they don't. */}
          <label className="tap pressable flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-line text-sm">
            <Camera size={18} aria-hidden="true" /> Add photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onAttachPhoto(file)
                // Cleared so photographing the same thing twice still fires
                // a change event.
                e.target.value = ''
              }}
            />
          </label>
          {/* Notes live on the job, not the task. "The ceiling grid isn't in
              yet" is about the job, and a note buried under one of sixteen
              tasks is a note nobody finds. */}
          <button
            onClick={onOpenNotes}
            className="tap pressable flex items-center justify-center gap-2 rounded-sm border border-line text-sm"
          >
            <StickyNote size={18} aria-hidden="true" /> Handover notes
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-ink-2">
          Prototype — the photo stays on this phone. Nothing is uploaded, and it doesn&apos;t
          survive a reload.
        </p>
      </div>

      {/* This task's own history, on the task rather than a screen away.
          A job-wide list interleaves nine tasks, so following one task's
          story meant scanning the page for its name — and the question
          "how did this get to 100%" is asked while standing on the task,
          not somewhere else. The job screen still has the full list,
          grouped by task, for when the question is about the whole job. */}
      {history.length > 0 && (
        <div className="mt-8 border-t border-line pt-6">
          <h3 className="mb-2 text-xs font-medium text-ink-2">
            History
          </h3>
          <ul className="rows">
            {history.map((entry, i) => (
              <li
                key={`${entry.at}-${i}`}
                className="flex items-baseline justify-between gap-2 border-b border-line px-4 py-2 last:border-b-0"
              >
                <span className="min-w-0 text-xs leading-snug">
                  <span className="font-medium">{entry.by}</span>{' '}
                  <span className="text-ink-2">{describe(entry)}</span>
                </span>
                <span className="shrink-0 text-xs text-ink-2">
                  {relativeTime(entry.at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

// "set it to 75%" reads better than a bare number, and the from-value is only
// worth showing when there was one — "from nothing to 25%" is noise on a
// task's first entry.
function describe(entry) {
  if (entry.na) return 'marked it not applicable'
  const to = `${entry.to}%`
  if (entry.from === null || entry.from === undefined) return `set it to ${to}`
  if (entry.from === entry.to) return `confirmed it at ${to}`
  return `moved it from ${entry.from}% to ${to}`
}
