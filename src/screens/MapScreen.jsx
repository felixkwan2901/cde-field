import { MapPin } from 'lucide-react'
import JobMap from '../components/JobMap'
import EmptyState, { SkeletonRows } from '../components/EmptyState'
import { jobProgress, progressCaption } from '../lib/progress'

// The map used to be a 190px strip on Today, wedged between the day ring
// and the job list. At that size it answers "roughly where" and nothing
// else — you cannot see the road you would take, and two sites in the same
// suburb sit on top of each other. Given a tab of its own it can be the
// size of the screen, which is the size a map has to be to be worth
// opening. Tapping a pin opens that job, so it is a way into the work
// rather than a picture of it.
export default function MapScreen({ jobs, loading, onOpenJob }) {
  if (loading) return <SkeletonRows count={2} />

  const placeable = jobs.filter((j) => typeof j.site?.lat === 'number')
  if (placeable.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No sites to place"
        body="A job appears here once it has an address on it."
      />
    )
  }

  return (
    <>
      {/* Full-bleed, cancelling the frame's 16px gutter. A map inset in a
          rounded card is a picture of a map; one that runs off both edges
          is the ground you are standing on. Tall enough to be worth
          opening, short enough that the list under it is discoverable
          without a scroll that feels like a search. */}
      <div className="-mx-4 -mt-2">
        <JobMap jobs={placeable} onOpenJob={onOpenJob} height={400} bleed />
      </div>

      <p className="rows-label">Sites</p>
      <div className="rows">
        {placeable.map((job) => (
          <button key={job.id} className="row items-center" onClick={() => onOpenJob(job.id)}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2">
              <MapPin size={17} aria-hidden="true" className="text-ink-2" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{job.jobName}</span>
              <span className="block truncate text-xs text-ink-2">
                {job.site.address}
              </span>
            </span>
            <span className="shrink-0 text-xs tabular-nums text-ink-2">
              {progressCaption(jobProgress(job.tasks))}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
