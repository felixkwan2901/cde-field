import { useCallback, useEffect, useState } from 'react'
import Screen from './components/Screen'
import SyncBadge from './components/SyncBadge'
import UndoToast from './components/UndoToast'
import { SkeletonRows } from './components/EmptyState'
import RoleScreen from './screens/RoleScreen'
import StaffPickerScreen from './screens/StaffPickerScreen'
import ManagerScreen from './screens/ManagerScreen'
import ReportScreen from './screens/ReportScreen'
import TodayScreen from './screens/TodayScreen'
import JobTasksScreen from './screens/JobTasksScreen'
import TaskDetailScreen from './screens/TaskDetailScreen'
import JobInfoScreen from './screens/JobInfoScreen'
import { listAllJobs, listJobsForStaff, listStaff, setTaskPercent, addAttachment } from './lib/dataSource'
import { readStaff, writeStaff } from './lib/identity'
import { applyTheme, readTheme } from './lib/theme'
import { enqueue, readQueue, startFlushing } from './lib/outbox'

const initialTheme = applyTheme(readTheme())

// Five linear screens, so navigation is a switch rather than a router. The
// tripwire for adding one: if this passes about eight screens, or needs real
// scroll restoration, take the dependency.
export default function App() {
  const [theme, setTheme] = useState(initialTheme)
  const [staff, setStaff] = useState(readStaff)
  // Chosen before the name, and only asked once — it is stored with the
  // identity, so switching who you are also lets you switch which question
  // the app is answering.
  const [role, setRole] = useState(() => readStaff()?.role ?? null)
  const [roster, setRoster] = useState([])
  const [rosterLoading, setRosterLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  // Bumped to ask for a re-read. An effect keyed on it beats calling a
  // refresh function from inside another effect: the state updates then
  // happen in the promise callback rather than synchronously during render,
  // which is the difference between one render and a cascade of them.
  const [reloadKey, setReloadKey] = useState(0)
  const [view, setView] = useState({ name: 'today' })
  const [sync, setSync] = useState('saved')
  const [pending, setPending] = useState(0)
  const [undo, setUndo] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    listStaff().then((list) => {
      setRoster(list)
      setRosterLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!staff) return undefined
    let cancelled = false
    const load = role === 'manager' ? listAllJobs() : listJobsForStaff(staff.id)
    load.then((list) => {
      if (cancelled) return
      setJobs(list)
      setJobsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [staff, role, reloadKey])

  useEffect(() => {
    readQueue().then((q) => setPending(q.length))
    return startFlushing(async (result) => {
      setPending((await readQueue()).length)
      if (result.skipped.length) {
        // Named, not swallowed. Somebody else set that task more recently
        // while this phone was offline, so the queued figure was dropped
        // rather than overwriting a newer one — and the person who typed it
        // is the one who needs to know.
        setNotice(
          `${result.skipped.length} update${result.skipped.length === 1 ? '' : 's'} weren't applied — someone changed those tasks while you were offline.`,
        )
      }
      if (result.sent) {
        setSync('saved')
        setReloadKey((n) => n + 1)
      }
    })
  }, [])

  function toggleTheme() {
    setTheme(applyTheme(theme === 'dark' ? 'light' : 'dark'))
  }

  function pickStaff(person) {
    setStaff(writeStaff({ ...person, role }))
    setView({ name: 'today' })
  }

  // Memoised because JobMap rebuilds its markers when this changes, and an
  // arrow function created during render is a different function every time.
  const openJob = useCallback((jobId) => setView({ name: 'job', jobId }), [])

  function signOut() {
    writeStaff(null)
    setStaff(null)
    setRole(null)
  }

  const job = jobs.find((j) => j.id === view.jobId)
  const task = job?.tasks.find((t) => t.id === view.taskId)

  // Optimistic: the number changes the instant the chip is tapped, and the
  // badge — never the number — tells the truth about whether it landed.
  async function saveTask(nextTask, { pct, na }, previous) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id !== job.id
          ? j
          : {
              ...j,
              tasks: j.tasks.map((t) =>
                t.id !== nextTask.id
                  ? t
                  : { ...t, pct, na, updatedBy: staff.name, updatedAt: new Date().toISOString() },
              ),
            },
      ),
    )
    setUndo({ taskId: nextTask.id, previous, label: na ? 'Marked not applicable' : `Set to ${pct}%` })

    const op = { jobNumber: job.jobNumber, taskId: nextTask.id, pct, na, by: staff.name, at: new Date().toISOString() }
    if (!navigator.onLine) {
      setPending((await enqueue(op)).length)
      setSync('offline')
      return
    }
    setSync('saving')
    try {
      await setTaskPercent(op)
      setSync('saved')
    } catch {
      setPending((await enqueue(op)).length)
      setSync('offline')
    }
  }

  async function fakeAttach(kind) {
    await addAttachment(job.id, task.id, {
      kind,
      text: kind === 'note' ? 'Waiting on the ceiling grid before fit-off.' : undefined,
      at: new Date().toISOString(),
      by: staff.name,
    })
    setReloadKey((n) => n + 1)
  }

  if (!role) return <RoleScreen onPick={setRole} />
  if (!staff) {
    return <StaffPickerScreen staff={roster} loading={rosterLoading} onPick={pickStaff} />
  }

  const chrome = {
    staff,
    theme,
    onToggleTheme: toggleTheme,
    onSwitchStaff: signOut,
  }

  const body = () => {
    if (view.name === 'today') {
      return role === 'manager' ? (
        <ManagerScreen
          jobs={jobs}
          roster={roster}
          loading={jobsLoading}
          onOpenJob={openJob}
          onOpenReport={() => setView({ name: 'report' })}
        />
      ) : (
        <TodayScreen jobs={jobs} loading={jobsLoading} onOpenJob={openJob} />
      )
    }
    if (view.name === 'report') return <ReportScreen jobs={jobs} roster={roster} />
    if (!job) return <SkeletonRows />
    if (view.name === 'job') {
      return (
        <JobTasksScreen
          job={job}
          onOpenTask={(taskId) => setView({ name: 'task', jobId: job.id, taskId })}
          onOpenInfo={() => setView({ name: 'info', jobId: job.id })}
        />
      )
    }
    if (view.name === 'info') return <JobInfoScreen job={job} />
    if (view.name === 'task' && task) {
      return (
        <TaskDetailScreen
          task={task}
          position={job.tasks.indexOf(task) + 1}
          total={job.tasks.length}
          onSetPercent={(pct) => saveTask(task, { pct, na: false }, { pct: task.pct, na: task.na })}
          onToggleNa={() =>
            saveTask(task, { pct: task.na ? task.pct : null, na: !task.na }, { pct: task.pct, na: task.na })
          }
          onFakeAttach={fakeAttach}
        />
      )
    }
    return <SkeletonRows />
  }

  const titles = {
    today:
      role === 'manager'
        ? { title: 'All jobs', subtitle: `${staff.name} · managing` }
        : { title: 'Today', subtitle: staff.name },
    job: { title: job ? `${job.jobNumber} ${job.jobName}` : 'Job' },
    info: { title: 'Job info', subtitle: job?.jobName },
    report: { title: 'Meeting report', subtitle: 'Field progress' },
    task: { title: job ? job.jobName : 'Task' },
  }
  const back = {
    today: null,
    job: () => setView({ name: 'today' }),
    info: () => setView({ name: 'job', jobId: view.jobId }),
    report: () => setView({ name: 'today' }),
    task: () => setView({ name: 'job', jobId: view.jobId }),
  }[view.name]

  return (
    <>
      <Screen {...chrome} {...titles[view.name]} onBack={back}>
        <div className="mb-3 flex justify-end">
          <SyncBadge status={sync} pending={pending} />
        </div>
        {notice && (
          <div className="mb-3 rounded-xl bg-[color:var(--status-warning-bg)] px-3 py-2 text-[13px] text-[color:var(--status-warning)]">
            {notice}{' '}
            <button className="underline" onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </div>
        )}
        {body()}
      </Screen>
      {undo && (
        <UndoToast
          message={undo.label}
          onExpire={() => setUndo(null)}
          onUndo={() => {
            const target = job?.tasks.find((t) => t.id === undo.taskId)
            if (target) saveTask(target, undo.previous, { pct: target.pct, na: target.na })
            setUndo(null)
          }}
        />
      )}
    </>
  )
}
