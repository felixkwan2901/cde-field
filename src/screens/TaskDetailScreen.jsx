import { Camera, ChevronRight, StickyNote } from 'lucide-react'
import PercentChips from '../components/PercentChips'
import ProgressRing from '../components/ProgressRing'
import TaskStatus from '../components/TaskStatus'
import { relativeTime } from '../lib/format'

// The screen the demo lives or dies on. Top to bottom: what it is, what it
// is at, how to change it, then the extras. The primary control sits in the
// bottom two-thirds where a thumb reaches without shifting grip.
export default function TaskDetailScreen({ task, position, total, changes = 0, onSetPercent, onToggleNa, onAttachPhoto, onOpenNotes, onOpenHistory }) {
  return (
    <>
      <p className="text-[13px] text-[color:var(--text-muted)]">
        Task {position} of {total} · {task.area}
      </p>
      <h2 className="mt-1 text-[22px] font-semibold leading-snug">{task.name}</h2>

      {/* A ring rather than a bare number. The screen needed one thing the eye
          lands on first — at arm's length in sun a figure floating in space
          reads as text among text, where a filled arc is a shape you take in
          before you read anything. */}
      <div className="card my-6 flex flex-col items-center gap-2 px-4 py-6">
        {task.na ? (
          <>
            <p className="text-[22px] font-semibold text-[color:var(--text-muted)]">Not applicable</p>
            <p className="text-[13px] text-[color:var(--text-secondary)]">
              Excluded from this job&apos;s percentage
            </p>
          </>
        ) : (
          <ProgressRing
            progress={{
              state: typeof task.pct !== 'number' ? 'zero' : task.pct === 0 ? 'zero' : task.pct >= 100 ? 'complete' : 'progress',
              percent: typeof task.pct === 'number' ? task.pct : 0,
              started: 0,
              total: 1,
            }}
            size={132}
            stroke={11}
          />
        )}
        {!task.na && <TaskStatus task={task} showLabel />}
        {/* The obvious question at 100% is "how did it get there, and who
            said so". This line was already answering half of it, so it is
            the way in rather than another button competing with the chips. */}
        {task.updatedBy && !task.na && (
          <button
            onClick={onOpenHistory}
            className="tap pressable -mb-2 flex items-center gap-1 rounded-[var(--radius-control)] px-2 text-[13px] text-[color:var(--text-secondary)]"
          >
            Set by {task.updatedBy}, {relativeTime(task.updatedAt)}
            {changes > 1 && (
              <span className="text-[color:var(--text-muted)]">&nbsp;· {changes} changes</span>
            )}
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      <PercentChips value={task.na ? null : task.pct} onChange={onSetPercent} disabled={task.na} />

      <button
        onClick={onToggleNa}
        className="tap pressable mt-4 flex w-full items-center justify-center rounded-[var(--radius-control)] bg-[color:var(--surface-2)] text-[14px] text-[color:var(--text-secondary)]"
      >
        {task.na ? 'This job does need it' : "Doesn't apply to this job"}
      </button>

      <div className="mt-7 border-t border-[color:var(--border)] pt-5">
        {task.attachments.length > 0 && (
          <ul className="mb-3 flex flex-col gap-2">
            {task.attachments.map((a) => (
              <li key={a.id}>
                {a.kind === 'photo' ? (
                  <img
                    src={a.src}
                    alt="Site photo"
                    className="max-h-56 w-full rounded-[var(--radius-control)] object-cover"
                  />
                ) : (
                  <p className="rounded-[var(--radius-control)] bg-[color:var(--surface-2)] px-3 py-2 text-[14px] text-[color:var(--text-secondary)]">
                    {a.text}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-2 gap-3">
          {/* A real capture, not a placeholder. `capture="environment"` asks
              for the rear camera directly, so on a phone this opens the
              camera rather than a file browser — which is the difference
              between a demo people believe and one they don't. */}
          <label className="tap pressable card flex cursor-pointer items-center justify-center gap-2 text-[15px]">
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
            className="tap pressable card flex items-center justify-center gap-2 text-[15px]"
          >
            <StickyNote size={18} aria-hidden="true" /> Handover notes
          </button>
        </div>
        <p className="mt-2 text-center text-[12px] text-[color:var(--text-muted)]">
          Prototype — the photo stays on this phone. Nothing is uploaded, and it doesn&apos;t
          survive a reload.
        </p>
      </div>
    </>
  )
}
