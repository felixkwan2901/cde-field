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
                    {/* Four jobs that all look like "number, name, address,
                        caption" are four of the same card. Commercial and
                        residential work are different days — different gear
                        in the van, different people on site — so the kind of
                        job leads, and the number drops into the same eyebrow
                        with it. The name then gets the line to itself, which
                        matches the job screen, where the name is the title
                        and "Commercial · Job 9412" the subtitle. */}
                    <p className="truncate text-xs uppercase tracking-wide text-ink-2">
                      {job.type} · {job.jobNumber}
                    </p>
                    {/* The name is the identity, so it never gets cut. It
                        sits on one line at 375px and wraps on the narrow
                        phones where it would otherwise become "Northwood
                        Medical ...". */}
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{job.jobName}</p>
                    {/* Two lines rather than a truncation: every job here is
                        a street and a suburb, and the suburb is how you tell
                        them apart — it is the half that was being cut. */}
                    <p className="line-clamp-2 text-xs leading-snug text-ink-2">
                      {job.site.address}
                    </p>
                    {/* Wraps rather than truncating, for the same reason as
                        the address: it was cutting the name off the person
                        who last touched the job — "Tom Pric…" — which is the
                        only part of the line you might act on. */}
                    <p className="mt-1 line-clamp-2 text-xs leading-snug text-ink-2">
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
