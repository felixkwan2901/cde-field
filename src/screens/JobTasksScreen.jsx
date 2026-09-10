import { ChevronRight, History, MapPin, MessageSquare } from 'lucide-react'
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
      <div className="mb-6">
        <div className="flex items-end justify-between gap-4 pb-2">
          <div className="min-w-0">
            <p className="truncate text-md font-medium leading-tight">{job.jobName}</p>
            <p className="mt-1 text-sm text-ink-2">{progressCaption(progress)}</p>
          </div>
          <span className="figure text-2xl">
            {progress.state === 'no-data' ? <span className="text-ink-2">—</span> : `${progress.percent}%`}
          </span>
        </div>
        <ProgressBar pct={progress.state === 'no-data' ? null : progress.percent} />
        {/* The address strip doubles as the door to the info screen. It is a
            row you glance at anyway, so the common case costs no taps and no
            extra screen space, and the rare case costs one tap where your
            thumb already is. A tab bar at the top would permanently spend a
            48px band on a screen you open ten times a day for something
            else. */}
        <button
          onClick={onOpenInfo}
          className="tap flex w-full items-center gap-2 border-b border-line text-left"
        >
          <MapPin size={18} className="shrink-0 text-ink-2" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm">{job.site.address}</span>
          <ChevronRight size={18} className="shrink-0 text-ink-2" aria-hidden="true" />
        </button>

        {/* The latest handover note, shown rather than hidden behind a tap.
            It is the one thing on this screen someone else wrote for you,
            and burying it a level down means it gets read by whoever goes
            looking — which is the people who need it least. */}
        <button
          onClick={onOpenNotes}
          className="tap flex w-full items-start gap-2 border-b border-line py-4 text-left"
        >
          <MessageSquare size={18} className="mt-1 shrink-0 text-ink-2" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            {job.notes?.length ? (
              <>
                <span className="line-clamp-2 text-xs leading-snug">{job.notes[0].text}</span>
                <span className="mt-1 block text-xs text-ink-2">
                  {job.notes[0].by} · {job.notes.length} note{job.notes.length === 1 ? '' : 's'}
                </span>
              </>
            ) : (
              <span className="text-xs text-ink-2">
                Add a handover note
              </span>
            )}
          </span>
          <ChevronRight size={18} className="mt-1 shrink-0 text-ink-2" aria-hidden="true" />
        </button>

        {/* Several people work one job, so a percentage on its own does not
            say who moved it or when. The count is on the button because it
            is the difference between "worth a look" and "nothing here". */}
        <button
          onClick={onOpenHistory}
          className="tap flex w-full items-center gap-2 border-b border-line text-left"
        >
          <History size={18} className="shrink-0 text-ink-2" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-xs">
            History
            {job.history?.length ? (
              <span className="text-ink-2"> · {job.history.length} change{job.history.length === 1 ? '' : 's'}</span>
            ) : null}
          </span>
          <ChevronRight size={18} className="shrink-0 text-ink-2" aria-hidden="true" />
        </button>
      </div>

      {job.tasks.length === 0 ? (
        <EmptyState
          title="Not broken down yet"
          body="Nobody has set the task list for this job. It'll appear here once they do."
        />
      ) : (
        // Full-bleed rows under a plain area label, not a card per task and
        // not a card per area. Fifteen tasks used to be fifteen rounded
        // rectangles with a shadow each: thirty drawn edges to express one
        // list. A hairline does the same job with one.
        [...areas].map(([area, tasks]) => (
          <section key={area} className="mb-6">
            <p className="rows-label">{area}</p>
            <ul className="rows">
              {tasks.map((task) => (
                <li key={task.id}>
                  <button onClick={() => onOpenTask(task.id)} className="row flex-col !gap-2">
                    <span className="flex w-full items-start gap-4">
                      <span className="flex min-w-0 flex-1 items-start gap-2 text-sm leading-snug">
                        {/* mt-1.5 is optical, not layout: it seats a 10px
                            dot on a 16px baseline. */}
                        <span className="mt-1.5">
                          <TaskStatus task={task} />
                        </span>
                        <span className="min-w-0">{task.name}</span>
                      </span>
                      <span className="figure shrink-0 text-lg">
                        {task.na ? <span className="text-sm text-ink-2">N/A</span>
                          : typeof task.pct === 'number' ? `${task.pct}%`
                          : <span className="text-ink-2">—</span>}
                      </span>
                      <ChevronRight size={20} className="mt-1 shrink-0 text-ink-2" aria-hidden="true" />
                    </span>
                    <ProgressBar pct={task.pct} na={task.na} />
                    {task.updatedBy && (
                      <span className="block w-full truncate text-xs text-ink-2">
                        {task.updatedBy} · {relativeTime(task.updatedAt)}
                      </span>
                    )}
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
