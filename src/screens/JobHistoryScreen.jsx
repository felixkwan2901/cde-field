import { History } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import TaskStatus from '../components/TaskStatus'
import { relativeTime } from '../lib/format'

// Who changed what.
//
// Grouped by task rather than listed in one chronological run. A flat list
// interleaves nine tasks, so "Fit-off — outlets & switches" appears three
// times separated by other tasks' rows, and following one task's story means
// scanning the whole page for its name. Grouped, each task's chain is three
// lines in one place.
//
// Groups are ordered by most recent activity, so what moved today is at the
// top and what has not been touched since August is at the bottom — the same
// ordering question the manager screen answers, asked of tasks instead of
// jobs.
//
// A task's own history also appears inline on its task screen, which is where
// "why is this at 100%" gets asked. This is the whole-job view, for when the
// question is "what has been happening here".
export default function JobHistoryScreen({ job }) {
  const entries = job.history ?? []

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No changes recorded yet"
        body="Every percentage someone sets on this job shows up here."
      />
    )
  }

  const groups = new Map()
  for (const entry of entries) {
    const list = groups.get(entry.t) ?? []
    list.push(entry)
    groups.set(entry.t, list)
  }

  const ordered = [...groups.entries()]
    .map(([id, list]) => ({
      id,
      task: job.tasks.find((t) => t.id === id),
      label: job.tasks.find((t) => t.id === id)?.name ?? id,
      entries: list,
      latest: Math.max(...list.map((e) => new Date(e.at).getTime())),
    }))
    .sort((a, b) => b.latest - a.latest)

  return (
    <div className="flex flex-col gap-4">
      {ordered.map((group) => (
        <section key={group.id}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 px-1">
            <h2 className="flex min-w-0 items-center gap-2 text-[15px] font-medium">
              {group.task && <TaskStatus task={group.task} />}
              <span className="min-w-0 truncate">{group.label}</span>
            </h2>
            {group.task && !group.task.na && typeof group.task.pct === 'number' && (
              <span className="shrink-0 text-[15px] font-semibold tabular-nums">
                {group.task.pct}%
              </span>
            )}
          </div>
          <ul className="card overflow-hidden">
            {group.entries.map((entry, i) => (
              <li
                key={`${entry.at}-${i}`}
                className="flex items-baseline justify-between gap-3 border-b border-[color:var(--border)] px-4 py-2.5 last:border-b-0"
              >
                <span className="min-w-0 text-[14px] leading-snug">
                  <span className="font-medium">{entry.by}</span>{' '}
                  <span className="text-[color:var(--text-secondary)]">{describe(entry)}</span>
                </span>
                <span className="shrink-0 text-[12px] text-[color:var(--text-muted)]">
                  {relativeTime(entry.at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
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
