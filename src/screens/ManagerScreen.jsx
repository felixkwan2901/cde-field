import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
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
export default function ManagerScreen({ section, jobs, roster, loading, onOpenJob, onOpenSection }) {
  const [showSilent, setShowSilent] = useState(false)

  if (loading) return <SkeletonRows count={4} />

  const crew = crewActivity(jobs, roster)
  const active = crew.filter((p) => p.last)
  const silent = crew.filter((p) => !p.last)
  const quiet = jobs.filter((j) => !lastTouched(j))

  if (section === 'jobs') return <JobsSection jobs={jobs} onOpenJob={onOpenJob} />

  return (
    <>
      {/* One sentence about whether anything needs a look, rather than three
          figures in three different units. "5/19 · 3 · 1" sat under a heading
          saying Crew while two thirds of it counted jobs, and left you to
          work out for yourself which of the numbers was the bad one.

          The exception leads. On a morning when nothing is wrong this says
          so in a line and a manager can put the phone down, which is the
          whole job of a screen like this. */}
      <div className="card mb-6 p-4">
        {quiet.length > 0 ? (
          <button
            onClick={() => onOpenSection?.('jobs')}
            className="tap pressable flex w-full items-center gap-2 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-warn">
                {quiet.length} job{quiet.length === 1 ? ' has' : 's have'} nothing recorded
              </span>
              <span className="mt-1 block text-xs text-ink-2">
                {jobs.length - quiet.length} of {jobs.length} moving · tap to see them
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-ink-2" aria-hidden="true" />
          </button>
        ) : (
          <p className="text-sm">
            <span className="block font-medium">Every job has progress recorded</span>
            <span className="mt-1 block text-xs text-ink-2">
              {jobs.length} job{jobs.length === 1 ? '' : 's'} on the go
            </span>
          </p>
        )}
      </div>

      {/* The count moves onto the heading. It was the one genuinely useful
          figure in the row of three, and it belongs on the list it counts. */}
      <p className="list-label flex items-baseline justify-between gap-2">
        <span>Recording</span>
        <span className="font-normal tabular-nums">
          {active.length} of {crew.length}
        </span>
      </p>
      <ul className="list-group">
        {active.map((person) => (
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
                  {/* Wraps: "Switchboard install & termination · Nor…" cut
                      the job name off the task, and which job it was on is
                      half of what the line is for. */}
                  <p className="line-clamp-2 text-xs leading-snug text-ink-2">
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

      {/* Everybody who has recorded nothing, folded into one row.
          Who has recorded nothing is genuinely the more useful half of this
          list — a name with no activity is either someone who needs showing
          how, or a sign the app is not being used on that site — but as
          fourteen identical rows saying "No activity yet" it buried the five
          people who had done something and pushed them off the screen. It is
          one line that you open when you want it. */}
      {silent.length > 0 && (
        <>
          <button
            onClick={() => setShowSilent((v) => !v)}
            aria-expanded={showSilent}
            className="tap list-label mt-6 flex w-full items-center gap-2 text-left"
          >
            <ChevronDown
              size={16}
              aria-hidden="true"
              className="shrink-0 transition-transform"
              style={{ transform: showSilent ? 'none' : 'rotate(-90deg)' }}
            />
            <span className="min-w-0 flex-1">Nothing recorded</span>
            <span className="shrink-0 font-normal tabular-nums">{silent.length}</span>
          </button>
          {showSilent && (
            <ul className="list-group">
              {silent.map((person) => (
                <li key={person.name} className="list-row">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">
                    {initials(person.name)}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm">{person.name}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
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


