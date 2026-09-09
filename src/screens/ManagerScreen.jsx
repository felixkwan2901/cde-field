import { ChevronRight } from 'lucide-react'
import JobMap from '../components/JobMap'
import ProgressRing from '../components/ProgressRing'
import { SkeletonRows } from '../components/EmptyState'
import { jobProgress, progressCaption } from '../lib/progress'
import { relativeTime } from '../lib/format'

// The manager's question is not the worker's. It is "where has nothing
// happened", so the list is sorted by least-recently-touched rather than by
// job number or size — the neglected jobs sort to the top instead of being
// buried in the middle of an alphabetical list. A job nobody has recorded
// anything against at all sorts first of all, because that is the strongest
// version of the same signal.
function lastTouched(job) {
  const times = (job.tasks ?? []).map((t) => t.updatedAt).filter(Boolean)
  return times.length ? Math.max(...times.map((t) => new Date(t).getTime())) : null
}

// Who is actually using this. Built from the attributions on the tasks
// themselves rather than from a separate activity log: the record already
// says who set each percentage and when, so a second source would only be
// something else to disagree.
function crewActivity(jobs) {
  const people = new Map()
  for (const job of jobs) {
    for (const task of job.tasks ?? []) {
      if (!task.updatedBy || !task.updatedAt) continue
      const at = new Date(task.updatedAt).getTime()
      const seen = people.get(task.updatedBy)
      if (!seen || at > seen.at) {
        people.set(task.updatedBy, { at, task: task.name, job: job.jobName })
      }
    }
  }
  return [...people.entries()]
    .map(([name, last]) => ({ name, ...last }))
    .sort((a, b) => b.at - a.at)
}

export default function ManagerScreen({ jobs, loading, onOpenJob }) {
  if (loading) return <SkeletonRows count={4} />

  const ordered = [...jobs].sort((a, b) => {
    const at = lastTouched(a)
    const bt = lastTouched(b)
    if (at === bt) return 0
    if (at === null) return -1
    if (bt === null) return 1
    return at - bt
  })
  const crew = crewActivity(jobs)

  return (
    <>
      <JobMap jobs={jobs} onOpenJob={onOpenJob} />

      <h2 className="mb-2 mt-6 text-[12px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
        Least recently updated
      </h2>
      <ul className="flex flex-col gap-2">
        {ordered.map((job) => {
          const progress = jobProgress(job.tasks)
          const touched = lastTouched(job)
          return (
            <li key={job.id}>
              <button
                onClick={() => onOpenJob(job.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-medium">
                    <span className="text-[color:var(--text-muted)]">{job.jobNumber}</span> {job.jobName}
                  </p>
                  <p className="truncate text-[13px] text-[color:var(--text-secondary)]">
                    {progressCaption(progress)}
                  </p>
                  <p className="truncate text-[13px]">
                    {touched ? (
                      <span className="text-[color:var(--text-muted)]">
                        Last update {relativeTime(new Date(touched).toISOString())}
                      </span>
                    ) : (
                      <span className="text-[color:var(--status-warning)]">Nothing recorded yet</span>
                    )}
                  </p>
                </div>
                <ProgressRing progress={progress} size={54} stroke={6} />
                <ChevronRight size={20} className="shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>

      <h2 className="mb-2 mt-7 text-[12px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
        Crew activity
      </h2>
      {crew.length === 0 ? (
        <p className="rounded-2xl bg-[color:var(--surface-2)] px-4 py-3 text-[13px] text-[color:var(--text-secondary)]">
          Nobody has recorded anything yet.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)]">
          {crew.map((person) => (
            <li key={person.name} className="border-b border-[color:var(--border)] px-4 py-3 last:border-b-0">
              <p className="text-[15px] font-medium">{person.name}</p>
              <p className="truncate text-[13px] text-[color:var(--text-secondary)]">
                {person.task} · {person.job}
              </p>
              <p className="text-[12px] text-[color:var(--text-muted)]">
                {relativeTime(new Date(person.at).toISOString())}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
