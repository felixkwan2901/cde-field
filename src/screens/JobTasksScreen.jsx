import { ChevronRight, History, MapPin, MessageSquare } from 'lucide-react'
import { arrivalTime, isOnSite, presence } from '../lib/presence'
import ProgressRing from '../components/ProgressRing'
import ProgressBar from '../components/ProgressBar'
import TaskStatus from '../components/TaskStatus'
import EmptyState from '../components/EmptyState'
import { jobProgress, progressCaption } from '../lib/progress'
import { relativeTime } from '../lib/format'

export default function JobTasksScreen({
  job,
  me,
  onSetVisit,
  onOpenTask,
  onOpenInfo,
  onOpenHistory,
  onOpenNotes,
}) {
  const progress = jobProgress(job.tasks)
  const { onSite, last, everVisited } = presence(job.visits)
  const here = isOnSite(job.visits, me)

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
      {/* One card, but three kinds of thing in it, and the design now says
          so. Top: how much is done. Middle: what somebody else put there —
          who is on site, and the last handover note. Bottom: the two doors
          to another screen. Previously all four lower rows were identical
          grey pills and the card had stopped having a shape. */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 p-4">
          <ProgressRing progress={progress} size={84} />
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">{job.jobName}</p>
            <p className="mt-1 text-xs text-ink-2">{progressCaption(progress)}</p>
          </div>
        </div>

        {/* Who is here, and when somebody last was. The percentage says how
            much of the job is done and nothing at all about whether anyone
            has been near it this week — which is what the office rings up to
            ask.

            An arrival time, never an elapsed total. "On site since 8:12" is
            a fact about the job; "on site 6h 12m" is a timesheet, and hours
            belong to the workbook. The full reasoning is at the top of
            lib/presence.js. */}
        <div className="job-row justify-between">
          <p className="min-w-0 flex-1 text-sm leading-snug">
            {onSite.length > 0 ? (
              <>
                <span className="font-medium">{siteLine(onSite, me)}</span>
                <span className="block text-xs text-ink-2">
                  since {arrivalTime(onSite[0].at)}
                </span>
              </>
            ) : everVisited ? (
              <span className="text-ink-2">
                Nobody on site · last here {relativeTime(last.at)}
              </span>
            ) : (
              // Not "0 visits". Nobody having recorded a visit is the absence
              // of a record, not evidence that nobody came — the same
              // distinction the progress ring makes between no tasks and 0%.
              <span className="text-ink-2">No site visits recorded</span>
            )}
          </p>
          {/* The only filled element on the card, because it is the only
              thing on it you can do. */}
          <button
            onClick={() => onSetVisit(here ? 'left' : 'arrived')}
            className={`tap pressable shrink-0 rounded-sm px-4 text-sm font-medium ${
              here ? 'bg-surface-2 text-ink' : 'bg-accent text-accent-ink'
            }`}
          >
            {here ? 'Leaving' : "I'm here"}
          </button>
        </div>

        {/* The latest handover note, shown rather than hidden behind a tap.
            It is the one thing on this screen someone else wrote for you,
            and burying it a level down means it gets read by whoever goes
            looking — which is the people who need it least.

            Set at the body size rather than the navigation size: it is the
            only prose on the card, and it is somebody talking to you. */}
        <button onClick={onOpenNotes} className="tap job-row job-row--tap items-start">
          <MessageSquare size={18} className="mt-0.5 shrink-0 text-ink-2" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            {job.notes?.length ? (
              <>
                <span className="line-clamp-2 text-sm leading-snug">
                  {job.notes[0].fields?.did ?? job.notes[0].text}
                </span>
                <span className="mt-1 block text-xs text-ink-2">
                  {job.notes[0].by} · {job.notes.length} note{job.notes.length === 1 ? '' : 's'}
                </span>
              </>
            ) : (
              <span className="text-sm text-ink-2">Add a handover note</span>
            )}
          </span>
          <ChevronRight size={18} className="mt-0.5 shrink-0 text-ink-2" aria-hidden="true" />
        </button>

        {/* The two doors, kept quiet and kept together. The address strip
            doubles as the way into the info screen: it is a row you glance at
            anyway, so the common case costs no taps and the rare case costs
            one where your thumb already is.

            It wraps rather than truncating. "48 Wairakei Road, Bryndwr,
            Christ…" cut off the suburb, which is the half you navigate by —
            a truncation that removes the useful part is worse than a second
            line. */}
        <button onClick={onOpenInfo} className="tap job-row job-row--tap">
          <MapPin size={18} className="shrink-0 text-ink-2" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-xs leading-snug text-ink-2">{job.site.address}</span>
          <ChevronRight size={18} className="shrink-0 text-ink-2" aria-hidden="true" />
        </button>

        {/* Several people work one job, so a percentage on its own does not
            say who moved it or when. The count is on the row because it is
            the difference between "worth a look" and "nothing here". */}
        <button onClick={onOpenHistory} className="tap job-row job-row--tap">
          <History size={18} className="shrink-0 text-ink-2" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-xs text-ink-2">
            History
            {job.history?.length ? (
              <span> · {job.history.length} change{job.history.length === 1 ? '' : 's'}</span>
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
        // One card per area with hairline-divided rows, rather than a
        // separate card per task. Fifteen floating cards is fifteen shadows
        // and fourteen gaps of dead space to scroll past; grouping them
        // makes the area the object on screen and the tasks its contents,
        // which is also what the heading has been claiming all along.
        [...areas].map(([area, tasks]) => (
          <section key={area} className="mb-6">
            <p className="list-label">{area}</p>
            <ul className="list-group">
              {tasks.map((task) => (
                <li key={task.id}>
                  <button
                    onClick={() => onOpenTask(task.id)}
                    className="list-row"
                  >
                    {/* The label can run to two lines at 16px, so the
                        percentage aligns to the top of the row rather than to
                        its middle — centred, it drifted below the name it
                        belongs to as soon as the name wrapped. */}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-start gap-2 text-sm leading-snug">
                        {/* mt-1.5 is optical, not layout: it seats a 10px
                            dot on a 16px baseline. */}
                        <span className="mt-1.5">
                          <TaskStatus task={task} />
                        </span>
                        <span className="min-w-0">{task.name}</span>
                      </p>
                      <div className="mt-2">
                        <ProgressBar pct={task.pct} na={task.na} />
                      </div>
                      {task.updatedBy && (
                        <p className="mt-1 truncate text-xs text-ink-2">
                          {task.updatedBy} · {relativeTime(task.updatedAt)}
                        </p>
                      )}
                    </div>
                    <span className="w-16 shrink-0 self-start pt-px text-right text-lg font-medium tabular-nums">
                      {task.na ? <span className="text-xs text-ink-2">N/A</span>
                        : typeof task.pct === 'number' ? `${task.pct}%`
                        : <span className="text-ink-2">—</span>}
                    </span>
                    <ChevronRight size={18} className="shrink-0 self-start pt-1 text-ink-2" aria-hidden="true" />
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

// "You and Jake" rather than "Andy, Jake" when one of them is you: the person
// reading this knows they are on site, so leading with their own name spends
// the only line on the screen saying something they can see by looking down.
function siteLine(onSite, me) {
  const names = onSite.map((v) => v.by)
  const others = names.filter((n) => n !== me)
  const iAmHere = names.length !== others.length

  if (!iAmHere) {
    if (others.length === 1) return `${others[0]} on site`
    if (others.length === 2) return `${others[0]} and ${others[1]} on site`
    return `${others[0]} and ${others.length - 1} others on site`
  }
  if (others.length === 0) return "You're on site"
  if (others.length === 1) return `You and ${others[0]} on site`
  return `You and ${others.length} others on site`
}
