import { ChevronRight, MapPin } from 'lucide-react'
import ProgressRing from '../components/ProgressRing'
import EmptyState, { SkeletonRows } from '../components/EmptyState'
import { dayProgress, jobProgress, progressCaption } from '../lib/progress'
import { relativeTime, today } from '../lib/format'

export default function TodayScreen({ jobs, loading, onOpenJob }) {
  const day = dayProgress(jobs)

  return (
    <>
      <div className="mb-5 flex items-center gap-4 rounded-2xl bg-[color:var(--surface-1)] p-4">
        <ProgressRing progress={day} size={96} />
        <div className="min-w-0">
          <p className="text-[15px] font-medium">{today()}</p>
          <p className="text-[14px] text-[color:var(--text-secondary)]">
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
                  className="flex w-full items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-medium">
                      <span className="text-[color:var(--text-muted)]">{job.jobNumber}</span> {job.jobName}
                    </p>
                    <p className="truncate text-[14px] text-[color:var(--text-secondary)]">{job.site.address}</p>
                    <p className="mt-0.5 truncate text-[13px] text-[color:var(--text-muted)]">
                      {progressCaption(progress)}
                      {touched && ` · ${touched.updatedBy} ${relativeTime(touched.updatedAt)}`}
                    </p>
                  </div>
                  <ProgressRing progress={progress} size={54} stroke={6} />
                  <ChevronRight size={20} className="shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
