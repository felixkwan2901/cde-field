import { ChevronRight, MapPin } from 'lucide-react'
import ProgressRing from '../components/ProgressRing'
import EmptyState, { SkeletonRows } from '../components/EmptyState'
import { dayProgress, jobProgress, progressCaption } from '../lib/progress'
import { relativeTime, today } from '../lib/format'

export default function TodayScreen({ jobs, loading, onOpenJob }) {
  const day = dayProgress(jobs)

  return (
    <>
      <div className="card mb-6 flex items-center gap-4 p-4">
        <ProgressRing progress={day} size={96} />
        <div className="min-w-0">
          <p className="text-sm font-medium">{today()}</p>
          <p className="text-xs text-ink-2">
            {jobs.length} job{jobs.length === 1 ? '' : 's'} · {progressCaption(day)}
          </p>
        </div>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : jobs.length === 0 ? (
        <EmptyState icon={MapPin} title="Nothing assigned to you today" />
      ) : (
        <ul className="flex flex-col gap-2">
          {jobs.map((job) => {
            const progress = jobProgress(job.tasks)
            const touched = job.tasks
              .filter((t) => t.updatedAt)
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
            return (
              <li key={job.id}>
                <button
                  onClick={() => onOpenJob(job.id)}
                  className="card pressable flex w-full items-center gap-2 p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      <span className="text-ink-2">{job.jobNumber}</span> {job.jobName}
                    </p>
                    <p className="truncate text-xs text-ink-2">{job.site.address}</p>
                    <p className="mt-1 truncate text-xs text-ink-2">
                      {progressCaption(progress)}
                      {touched && ` · ${touched.updatedBy} ${relativeTime(touched.updatedAt)}`}
                    </p>
                  </div>
                  <ProgressRing progress={progress} size={54} stroke={6} />
                  <ChevronRight size={20} className="shrink-0 text-ink-2" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
