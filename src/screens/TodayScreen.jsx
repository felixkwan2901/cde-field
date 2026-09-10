import { ChevronRight, MapPin } from 'lucide-react'
import ProgressBar from '../components/ProgressBar'
import EmptyState, { SkeletonRows } from '../components/EmptyState'
import { dayProgress, jobProgress, progressCaption } from '../lib/progress'
import { relativeTime, today } from '../lib/format'

// One figure, then the jobs behind it.
//
// The day used to be a 96px ring inside a card, given the same weight as
// the address underneath. It is the answer to the only question anyone
// opens this screen to ask, so it is now the largest thing on it — and a
// number at 52px is readable at arm's length outdoors, which the same
// number at 16px in the corner of a card is not.
function Figure({ progress, size = 'text-lg' }) {
  if (progress.state === 'no-data') return <span className={`figure ${size} text-ink-2`}>—</span>
  return <span className={`figure ${size}`}>{progress.percent}%</span>
}

export default function TodayScreen({ jobs, loading, onOpenJob }) {
  const day = dayProgress(jobs)

  return (
    <>
      <div className="flex items-end justify-between gap-4 pb-2">
        <div className="min-w-0">
          <p className="text-sm text-ink-2">{today()}</p>
          <p className="mt-1 text-sm text-ink-2">
            {jobs.length} job{jobs.length === 1 ? '' : 's'} · {progressCaption(day)}
          </p>
        </div>
        <Figure progress={day} size="text-2xl" />
      </div>
      <ProgressBar pct={day.state === 'no-data' ? null : day.percent} />

      {loading ? (
        <div className="pt-6">
          <SkeletonRows />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={MapPin} title="Nothing assigned to you today" />
      ) : (
        <ul className="rows mt-6">
          {jobs.map((job) => {
            const progress = jobProgress(job.tasks)
            const touched = job.tasks
              .filter((t) => t.updatedAt)
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
            return (
              <li key={job.id}>
                <button onClick={() => onOpenJob(job.id)} className="row flex-col !gap-2">
                  <span className="flex w-full items-start gap-4">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-md font-medium">
                        <span className="text-ink-2">{job.jobNumber}</span> {job.jobName}
                      </span>
                      <span className="mt-1 block truncate text-sm text-ink-2">{job.site.address}</span>
                    </span>
                    <Figure progress={progress} />
                    <ChevronRight size={20} className="mt-1 shrink-0 text-ink-2" aria-hidden="true" />
                  </span>
                  <ProgressBar pct={progress.state === 'no-data' ? null : progress.percent} />
                  <span className="block w-full truncate text-xs text-ink-2">
                    {progressCaption(progress)}
                    {touched && ` · ${touched.updatedBy} ${relativeTime(touched.updatedAt)}`}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
