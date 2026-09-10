import { History } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { relativeTime } from '../lib/format'

// Who changed what, newest first.
//
// A job is worked by several people over months, so "75%" on its own does
// not say whether it moved this morning or in July, or who to ask about it.
// Every percentage change already writes an entry — this is the first thing
// that reads them.
//
// Deliberately not editable and deliberately not deletable: the value of a
// history is that nobody can quietly tidy it.
export default function JobHistoryScreen({ job, taskId }) {
  // Filtered to one task when you arrived from that task's screen, which is
  // where "why is this at 100%" gets asked. Unfiltered from the job screen,
  // where the question is "what has been happening here".
  const entries = (job.history ?? []).filter((e) => !taskId || e.t === taskId)
  const labelFor = (taskId) => job.tasks.find((t) => t.id === taskId)?.name ?? taskId

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No changes recorded yet"
        body="Every percentage someone sets on this job shows up here."
      />
    )
  }

  return (
    <ul className="card overflow-hidden">
      {entries.map((entry, i) => (
        <li
          key={`${entry.at}-${entry.t}-${i}`}
          className="border-b border-[color:var(--border)] px-4 py-3 last:border-b-0"
        >
          <p className="text-[15px] leading-snug">{labelFor(entry.t)}</p>
          <p className="mt-0.5 text-[14px] text-[color:var(--text-secondary)]">
            <span className="font-medium text-[color:var(--text-primary)]">{entry.by}</span>{' '}
            {describe(entry)}
          </p>
          <p className="text-[12px] text-[color:var(--text-muted)]">{relativeTime(entry.at)}</p>
        </li>
      ))}
    </ul>
  )
}

// "set it to 75%" reads better than "75" on its own, and the from-value is
// only worth showing when there was one — "changed it from nothing to 25%"
// is noise on a task's first entry.
function describe(entry) {
  if (entry.na) return 'marked it not applicable'
  const to = `${entry.to}%`
  if (entry.from === null || entry.from === undefined) return `set it to ${to}`
  if (entry.from === entry.to) return `confirmed it at ${to}`
  return `moved it from ${entry.from}% to ${to}`
}
