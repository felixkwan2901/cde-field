import { useState } from 'react'
import { ChevronDown, ChevronRight, History, MapPin, MessageSquare, Phone, TriangleAlert, Wrench } from 'lucide-react'
import { arrivalTime, isOnSite, presence } from '../lib/presence'
import ProgressRing from '../components/ProgressRing'
import ProgressBar from '../components/ProgressBar'
import TaskStatus from '../components/TaskStatus'
import EmptyState from '../components/EmptyState'
import { groupShares, jobProgress, progressCaption } from '../lib/progress'
import { readCollapsed, writeCollapsed } from '../lib/collapsed'
import { taskState } from '../lib/taskState'
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

  // Computed together rather than per area, because making them add to
  // exactly 100 needs to see all of them at once.
  const shares = groupShares([...areas.values()])

  // Read once per mount rather than on every render, and keyed by the job so
  // navigating between two jobs does not carry one's folds onto the other.
  const [collapsed, setCollapsed] = useState(() => readCollapsed(job.jobNumber))

  function toggleArea(area) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(area)) next.delete(area)
      else next.add(area)
      writeCollapsed(job.jobNumber, next)
      return next
    })
  }

  return (
    <>
      {/* The card is now only the two live things: how much is done, and
          whether anybody is there. Everything you navigate to moved into the
          folders below it. */}
      <div className="card mb-6">
        {/* No job name here. This screen is pushed, so the bar shows its
            title permanently rather than only once you scroll — printing the
            name again 60px underneath it said nothing twice. The ring is the
            content; the caption is what the ring cannot say. */}
        <div className="flex items-center gap-4 p-4">
          <ProgressRing progress={progress} size={84} />
          <p className="min-w-0 text-sm leading-snug">{progressCaption(progress)}</p>
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

      </div>

      {/* The folders. Everything about the job that is not the task list,
          named by what you would be looking for rather than by where the
          data happens to sit — and each says what is inside, so the detail
          line answers "is it worth a tap" before you spend one.

          This was three rows: one called "Job info" holding five different
          things behind a scroll, one for notes, one for history. Standing at
          a gate wanting the foreman's number, that was a tap and then a
          hunt. */}
      <div className="tile-grid mb-6">
        <Folder
          icon={MapPin}
          name="Getting in"
          detail={job.site.gateCode ? `Gate ${job.site.gateCode}` : 'Address & parking'}
          onClick={() => onOpenInfo('access')}
        />
        <Folder
          icon={Phone}
          name="Who to call"
          detail={`${job.contacts.length} ${job.contacts.length === 1 ? 'number' : 'numbers'}`}
          onClick={() => onOpenInfo('contacts')}
        />
        <Folder
          icon={TriangleAlert}
          name="Safety"
          detail={
            job.inductionRequired
              ? 'Induction required'
              : `${job.hazards.length} ${job.hazards.length === 1 ? 'hazard' : 'hazards'}`
          }
          onClick={() => onOpenInfo('safety')}
        />
        <Folder
          icon={Wrench}
          name="The work"
          detail="Scope & dates"
          onClick={() => onOpenInfo('work')}
        />
        {/* Names who wrote the last one rather than only counting them.
            "Tom Price" is the reason you would open it. */}
        <Folder
          icon={MessageSquare}
          name="Notes"
          detail={job.notes?.length ? `${job.notes.length} · ${job.notes[0].by}` : 'None yet'}
          onClick={onOpenNotes}
        />
        <Folder
          icon={History}
          name="History"
          detail={
            job.history?.length
              ? `${job.history.length} ${job.history.length === 1 ? 'change' : 'changes'}`
              : 'Nothing yet'
          }
          onClick={onOpenHistory}
        />
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
        [...areas].map(([area, tasks], areaIndex) => {
          const isCollapsed = collapsed.has(area)
          const done = tasks.filter((t) => taskState(t) === 'done').length
          return (
          <section key={area} className="mb-6">
            {/* The area's share of the whole job, and across the areas these
                add to exactly 100%. Every counted task is worth the same
                slice — the job figure is an unweighted mean — so an area's
                share is simply how much of the job lives in it. It sits on
                the heading rather than on every row because on a row it
                would be the same number fifteen times, and because this is
                the line that already says "here is a section of the job". */}
            {/* The heading is the fold control. An area arrives open —
                folding is something you choose, never the default — and a
                folded one still says how many tasks it holds and how many
                are done, so what is hidden is the rows and never the work.
                */}
            <button
              onClick={() => toggleArea(area)}
              aria-expanded={!isCollapsed}
              aria-controls={`area-${areaIndex}`}
              className="tap list-label flex w-full items-center gap-2 text-left"
            >
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="shrink-0 transition-transform"
                style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none' }}
              />
              <span className="min-w-0 flex-1 truncate">{area}</span>
              <span className="shrink-0 font-normal tabular-nums">
                {isCollapsed && `${done} of ${tasks.length} done · `}
                {shares[areaIndex] != null && `${shares[areaIndex]}% of job`}
              </span>
            </button>
            {!isCollapsed && (
            <ul className="list-group" id={`area-${areaIndex}`}>
              {tasks.map((task) => {
                const partial =
                  !task.na && typeof task.pct === 'number' && task.pct > 0 && task.pct < 100
                return (
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
                      {/* The bar only appears while a task is part-done.
                          At 0% it is an empty trough and at 100% it is a
                          full one, and in both cases the dot and the figure
                          beside it have already said so — it was spending a
                          whole line per row to repeat them. Between the two
                          it shows something neither can: roughly how far. */}
                      {partial && (
                        <div className="mt-1.5">
                          <ProgressBar pct={task.pct} na={task.na} />
                        </div>
                      )}
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
                )
              })}
            </ul>
            )}
          </section>
          )
        })
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

// A folder: what it is, and what is in it. The detail line is the point — a
// grid of six labels with no counts makes you open all six to find which one
// has anything in it.
function Folder({ icon: Icon, name, detail, onClick }) {
  return (
    <button onClick={onClick} className="tap tile">
      <Icon size={20} className="text-ink-2" aria-hidden="true" />
      <span className="text-sm font-medium leading-tight">{name}</span>
      <span className="text-xs leading-tight text-ink-2">{detail}</span>
    </button>
  )
}
