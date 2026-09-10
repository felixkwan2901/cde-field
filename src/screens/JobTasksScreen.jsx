import { ChevronRight, History, MapPin, MessageSquare } from 'lucide-react'
import ProgressRing from '../components/ProgressRing'
import ProgressBar from '../components/ProgressBar'
import TaskStatus from '../components/TaskStatus'
import EmptyState from '../components/EmptyState'
import { jobProgress, progressCaption } from '../lib/progress'
import { relativeTime } from '../lib/format'

export default function JobTasksScreen({ job, onOpenTask, onOpenInfo, onOpenHistory, onOpenNotes }) {
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
      <div className="card mb-5 p-4">
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
          className="tap pressable mt-4 flex w-full items-center gap-2 rounded-[var(--radius-control)] bg-[color:var(--surface-2)] px-3 py-2 text-left"
        >
          <MapPin size={18} className="shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-[14px]">{job.site.address}</span>
          <ChevronRight size={18} className="shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
        </button>

        {/* The latest handover note, shown rather than hidden behind a tap.
            It is the one thing on this screen someone else wrote for you,
            and burying it a level down means it gets read by whoever goes
            looking — which is the people who need it least. */}
        <button
          onClick={onOpenNotes}
          className="tap pressable mt-4 flex w-full items-start gap-2 rounded-[var(--radius-control)] bg-[color:var(--surface-2)] px-3 py-2.5 text-left"
        >
          <MessageSquare size={18} className="mt-0.5 shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            {job.notes?.length ? (
              <>
                <span className="line-clamp-2 text-[14px] leading-snug">{job.notes[0].text}</span>
                <span className="mt-0.5 block text-[12px] text-[color:var(--text-muted)]">
                  {job.notes[0].by} · {job.notes.length} note{job.notes.length === 1 ? '' : 's'}
                </span>
              </>
            ) : (
              <span className="text-[14px] text-[color:var(--text-muted)]">
                Add a handover note
              </span>
            )}
          </span>
          <ChevronRight size={18} className="mt-0.5 shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
        </button>

        {/* Several people work one job, so a percentage on its own does not
            say who moved it or when. The count is on the button because it
            is the difference between "worth a look" and "nothing here". */}
        <button
          onClick={onOpenHistory}
          className="tap pressable mt-2 flex w-full items-center gap-2 rounded-[var(--radius-control)] bg-[color:var(--surface-2)] px-3 py-2 text-left"
        >
          <History size={18} className="shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-[14px]">
            History
            {job.history?.length ? (
              <span className="text-[color:var(--text-muted)]"> · {job.history.length} change{job.history.length === 1 ? '' : 's'}</span>
            ) : null}
          </span>
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
                    className="card pressable flex w-full items-center gap-3 px-3 py-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-start gap-2 text-[15px] leading-snug">
                        <span className="mt-[5px]">
                          <TaskStatus task={task} />
                        </span>
                        <span className="min-w-0">{task.name}</span>
                      </p>
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
