import { Camera, StickyNote } from 'lucide-react'
import PercentChips from '../components/PercentChips'
import ProgressRing from '../components/ProgressRing'
import TaskStatus from '../components/TaskStatus'
import { relativeTime } from '../lib/format'

// The screen the demo lives or dies on. Top to bottom: what it is, what it
// is at, how to change it, then the extras. The primary control sits in the
// bottom two-thirds where a thumb reaches without shifting grip.
export default function TaskDetailScreen({ task, position, total, onSetPercent, onToggleNa, onFakeAttach }) {
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
        {task.updatedBy && !task.na && (
          <p className="text-[13px] text-[color:var(--text-secondary)]">
            Set by {task.updatedBy}, {relativeTime(task.updatedAt)}
          </p>
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
              <li
                key={a.id}
                className="rounded-[var(--radius-control)] bg-[color:var(--surface-2)] px-3 py-2 text-[14px] text-[color:var(--text-secondary)]"
              >
                {a.kind === 'photo' ? '📷 Site photo' : a.text}
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onFakeAttach('photo')}
            className="tap pressable card flex items-center justify-center gap-2 text-[15px]"
          >
            <Camera size={18} aria-hidden="true" /> Add photo
          </button>
          <button
            onClick={() => onFakeAttach('note')}
            className="tap pressable card flex items-center justify-center gap-2 text-[15px]"
          >
            <StickyNote size={18} aria-hidden="true" /> Add note
          </button>
        </div>
        <p className="mt-2 text-center text-[12px] text-[color:var(--text-muted)]">
          Prototype — attachments aren&apos;t uploaded and don&apos;t survive a reload.
        </p>
      </div>
    </>
  )
}
