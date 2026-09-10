import { ChevronRight } from 'lucide-react'
import ProgressRing from '../components/ProgressRing'
import { SkeletonRows } from '../components/EmptyState'
import { crewActivity, lastTouched } from '../lib/crewActivity'
import { jobProgress, progressCaption } from '../lib/progress'
import { relativeTime, initials } from '../lib/format'

// The office's view, and it leads with people rather than jobs.
//
// A manager is not running a job — they are asking who is out there, what
// each of them has actually recorded, and what has gone quiet. Jobs are the
// second question, which is why they are now a second tab rather than a
// second scroll: eighteen crew above four jobs meant the jobs were below
// the fold on every phone, and a manager checking a job first had to scroll
// past everybody to reach it.
//
// No map here. Knowing where a site is matters when you are driving to it;
// from a desk the useful thing is the list.
export default function ManagerScreen({ section, jobs, roster, loading, onOpenJob }) {
  if (loading) return <SkeletonRows count={4} />

  const crew = crewActivity(jobs, roster)
  const active = crew.filter((p) => p.last)
  const quiet = jobs.filter((j) => !lastTouched(j))

  if (section === 'jobs') return <JobsSection jobs={jobs} onOpenJob={onOpenJob} />

  return (
    <>
      <div className="card mb-6 p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Figure value={`${active.length}/${crew.length}`} label="Crew recording" />
          <Figure value={jobs.length - quiet.length} label="Jobs moving" />
          <Figure value={quiet.length} label="Nothing recorded" tone={quiet.length ? 'warn' : undefined} />
        </div>
      </div>

      <p className="list-label">Crew</p>
      <ul className="list-group">
        {crew.map((person) => (
          <li
            key={person.name}
            className="list-row"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">
              {initials(person.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{person.name}</p>
              {person.last ? (
                <>
                  <p className="truncate text-xs text-ink-2">
                    {person.last.task} · {person.last.job}
                  </p>
                  <p className="text-xs text-ink-2">
                    {relativeTime(new Date(person.last.at).toISOString())} ·{' '}
                    {person.updates} update{person.updates === 1 ? '' : 's'} across{' '}
                    {person.jobs.length} job{person.jobs.length === 1 ? '' : 's'}
                  </p>
                </>
              ) : (
                <p className="text-xs text-ink-2">No activity yet</p>
              )}
            </div>
          </li>
        ))}
      </ul>

    </>
  )
}

function JobsSection({ jobs, onOpenJob }) {
  return (
    <>
      <p className="list-label">Least recently updated first</p>
      <ul className="flex flex-col gap-2">
        {[...jobs]
          .sort((a, b) => {
            const at = lastTouched(a)
            const bt = lastTouched(b)
            if (at === bt) return 0
            if (at === null) return -1
            if (bt === null) return 1
            return at - bt
          })
          .map((job) => {
            const progress = jobProgress(job.tasks)
            const touched = lastTouched(job)
            return (
              <li key={job.id}>
                <button
                  onClick={() => onOpenJob(job.id)}
                  className="card pressable flex w-full items-center gap-2 p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      <span className="text-ink-2">{job.jobNumber}</span>{' '}
                      {job.jobName}
                    </p>
                    <p className="truncate text-xs text-ink-2">
                      {progressCaption(progress)}
                    </p>
                    <p className="truncate text-xs">
                      {touched ? (
                        <span className="text-ink-2">
                          Last update {relativeTime(new Date(touched).toISOString())}
                        </span>
                      ) : (
                        <span className="text-warn">Nothing recorded yet</span>
                      )}
                    </p>
                  </div>
                  <ProgressRing progress={progress} size={54} stroke={6} />
                  <ChevronRight size={20} className="shrink-0 text-ink-2" aria-hidden="true" />
                </button>
              </li>
            )
          })}
      </ul>
    </>
  )
}

function Figure({ value, label, tone }) {
  return (
    <div>
      <p
        className="text-xl font-medium tabular-nums"
        style={tone === 'warn' ? { color: 'var(--status-warning)' } : undefined}
      >
        {value}
      </p>
      <p className="text-xs leading-tight text-ink-2">{label}</p>
    </div>
  )
}
