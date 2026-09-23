import { useState } from 'react'
import { ChevronRight, MapPin, Star } from 'lucide-react'
import ProgressRing from '../components/ProgressRing'
import EmptyState, { SkeletonRows } from '../components/EmptyState'
import { dayProgress, jobProgress, progressCaption } from '../lib/progress'
import { relativeTime, today } from '../lib/format'
import { readStarred, toggleStarred } from '../lib/starred'

// The card and the star are siblings, not nested.
//
// The card is a <button>, so a star inside it would be a button inside a
// button — invalid, and the inner one never fires. The <li> owns the row
// layout instead and holds the two side by side.
function JobCard({ job, starred, onOpen, onToggleStar }) {
  const progress = jobProgress(job.tasks)
  const touched = job.tasks
    .filter((t) => t.updatedAt)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]

  return (
    <li className="flex items-stretch gap-2">
      <button
        onClick={() => onOpen(job.id)}
        className="card pressable flex min-w-0 flex-1 items-center gap-2 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          {/* Commercial and residential work are different days — different
              gear in the van, different people on site — so the kind of job
              leads, and the number drops into the same eyebrow with it.
              Filtered because an untyped job has no kind, and joining a null
              left the line reading " · 9412" with a separator in front of
              nothing. */}
          <p className="truncate text-xs uppercase tracking-wide text-ink-2">
            {[job.type, job.jobNumber].filter(Boolean).join(' · ')}
          </p>
          {/* The name is the identity, so it never gets cut. */}
          <p className="line-clamp-2 text-sm font-medium leading-snug">{job.jobName}</p>
          {/* Two lines rather than a truncation: every job here is a street
              and a suburb, and the suburb is how you tell them apart. */}
          {job.site?.address && (
            <p className="line-clamp-2 text-xs leading-snug text-ink-2">{job.site.address}</p>
          )}
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-ink-2">
            {progressCaption(progress)}
            {touched && ` · ${touched.updatedBy} ${relativeTime(touched.updatedAt)}`}
          </p>
        </div>
        <ProgressRing progress={progress} size={54} stroke={6} />
        <ChevronRight size={20} className="shrink-0 text-ink-2" aria-hidden="true" />
      </button>

      {/* Its own control with its own hit area. It sits next to the one that
          opens the job and gets pressed with gloves on, so it is a full-height
          56px target rather than an icon tucked into a corner — hitting the
          wrong one means opening a job when you meant to flag it. */}
      <button
        onClick={() => onToggleStar(job.jobNumber)}
        aria-pressed={starred}
        aria-label={starred ? `Stop working on ${job.jobName}` : `I'm working on ${job.jobName}`}
        title={starred ? 'Working on this' : "I'm working on this"}
        className="card pressable flex w-14 shrink-0 items-center justify-center"
      >
        <Star
          size={22}
          aria-hidden="true"
          className={starred ? 'text-accent' : 'text-ink-2'}
          fill={starred ? 'currentColor' : 'none'}
        />
      </button>
    </li>
  )
}

export default function TodayScreen({ jobs, loading, onOpenJob, staffId }) {
  // Read once on mount. App keys this screen by staff id, so switching name
  // remounts and re-reads — the list is per person and the same phone gets
  // handed over, so showing the last bloke's jobs would be worse than none.
  const [starred, setStarred] = useState(() => readStarred(staffId))

  const isStarred = (job) => starred.includes(String(job.jobNumber))
  const onToggleStar = (jobNumber) => setStarred(toggleStarred(staffId, jobNumber))

  const mine = jobs.filter(isStarred)
  const rest = jobs.filter((j) => !isStarred(j))

  // The ring follows whatever the heading is about. Across twenty-eight jobs
  // nobody has touched it reads 0% forever and means nothing; across the two
  // you are actually on, it is your day.
  const scope = mine.length ? mine : jobs
  const day = dayProgress(scope)

  return (
    <>
      <div className="card mb-6 flex items-center gap-4 p-4">
        <ProgressRing progress={day} size={96} />
        <div className="min-w-0">
          <p className="text-sm font-medium">{today()}</p>
          <p className="text-xs text-ink-2">
            {mine.length
              ? `${mine.length} job${mine.length === 1 ? '' : 's'} you're on`
              : `${jobs.length} job${jobs.length === 1 ? '' : 's'}`}{' '}
            · {progressCaption(day)}
          </p>
        </div>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : jobs.length === 0 ? (
        <EmptyState icon={MapPin} title="No jobs yet" body="The office publishes the job list. It'll appear here once they do." />
      ) : (
        <>
          <p className="list-label">Yours</p>
          {mine.length === 0 ? (
            // First run is the common case for a while, so this says what the
            // star does rather than leaving a gap where a list should be.
            <p className="card mb-6 p-4 text-xs leading-relaxed text-ink-2">
              Tap the star on a job you're working on and it'll sit up here.
              It's just for you — nobody is assigning anything.
            </p>
          ) : (
            <ul className="mb-6 flex flex-col gap-2">
              {mine.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  starred
                  onOpen={onOpenJob}
                  onToggleStar={onToggleStar}
                />
              ))}
            </ul>
          )}

          {rest.length > 0 && (
            <>
              <p className="list-label">{mine.length ? 'Every other job' : 'Every job'}</p>
              <ul className="flex flex-col gap-2">
                {rest.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    starred={false}
                    onOpen={onOpenJob}
                    onToggleStar={onToggleStar}
                  />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </>
  )
}
