import { ChevronRight, MapPin } from 'lucide-react'
import ProgressRing from '../components/ProgressRing'
import ProgressBar from '../components/ProgressBar'
import EmptyState from '../components/EmptyState'
import { jobProgress, progressCaption } from '../lib/progress'
import { relativeTime } from '../lib/format'

export default function JobTasksScreen({ job, onOpenTask, onOpenInfo }) {
  const progress = jobProgress(job.tasks)

  // Grouped by area with a plain label, not a collapsible section. Folding
  // hides work, and on a job screen that is exactly the wrong default.
  const areas = job.tasks.reduce((map, task) => {
    const list = map.get(task.area) ?? []
    list.push(task)
    map.set(task.area, list)
    return map
  }, new Map())

  return (
    <>
      <div className="mb-4 rounded-2xl bg-[color:var(--surface-1)] p-4">
        <div className="flex items-center gap-4">
          <ProgressRing progress={progress} size={84} />
          <div className="min-w-0">
            <p className="text-[16px] font-medium leading-tight">{job.jobName}</p>
            <p className="mt-0.5 text-[14px] text-[color:var(--text-secondary)]">{progressCaption(progress)}</p>
          </div>
        </div>
        {/* The address strip doubles as the door to the info screen. It is a
            row you glance at anyway, so the common case costs no taps and no
            extra screen space, and the rare case costs one tap where your
            thumb already is. A tab bar at the top would permanently spend a
            48px band on a screen you open ten times a day for something
            else. */}
        <button
          onClick={onOpenInfo}
          className="tap mt-3 flex w-full items-center gap-2 rounded-xl border border-[color:var(--border)] px-3 py-2 text-left"
        >
          <MapPin size={18} className="shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-[14px]">{job.site.address}</span>
          <ChevronRight size={18} className="shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
        </button>
      </div>

      {job.tasks.length === 0 ? (
        <EmptyState
          title="Not broken down yet"
          body="Nobody has set the task list for this job. It'll appear here once they do."
        />
      ) : (
        [...areas].map(([area, tasks]) => (
          <section key={area} className="mb-5">
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
              {area}
            </h2>
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <li key={task.id}>
                  <button
                    onClick={() => onOpenTask(task.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-snug">{task.name}</p>
                      <div className="mt-2">
                        <ProgressBar pct={task.pct} na={task.na} />
                      </div>
                      {task.updatedBy && (
                        <p className="mt-1 truncate text-[12px] text-[color:var(--text-muted)]">
                          {task.updatedBy} · {relativeTime(task.updatedAt)}
                        </p>
                      )}
                    </div>
                    <span className="w-14 shrink-0 text-right text-[19px] font-semibold tabular-nums">
                      {task.na ? <span className="text-[13px] text-[color:var(--text-muted)]">N/A</span>
                        : typeof task.pct === 'number' ? `${task.pct}%`
                        : <span className="text-[color:var(--text-muted)]">—</span>}
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  )
}
