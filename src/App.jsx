import { useCallback, useEffect, useRef, useState } from 'react'
import { Home, Map as MapIcon, User, Users, Briefcase, FileText } from 'lucide-react'
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
import JobHistoryScreen from './screens/JobHistoryScreen'
import JobNotesScreen from './screens/JobNotesScreen'
import MapScreen from './screens/MapScreen'
import MeScreen from './screens/MeScreen'
import { addJobNote, getJob, listAllJobs, listJobsForStaff, listStaff, setTaskPercent, addAttachment } from './lib/dataSource'
import { readStaff, writeStaff } from './lib/identity'
import { applyTheme, readTheme } from './lib/theme'
import { enqueue, readQueue, startFlushing } from './lib/outbox'
import { clearDeepLinkJob, readDeepLinkJob } from './lib/deepLink'

const initialTheme = applyTheme(readTheme())

// The tabs, and with them the claim about what this app is. Everything here
// is a place you can be; everything not here — a job, a task, the notes on
// one — is somewhere you go *into*, which is why those push over the top and
// take the tab bar away with them.
//
// The two roles get different tabs rather than a shared set with items
// greyed out. They are different jobs: one person is recording work on the
// two sites they are standing on, the other is watching eighteen people
// across all of them.
const WORKER_TABS = [
  { key: 'today', label: 'Today', icon: Home },
  { key: 'map', label: 'Map', icon: MapIcon },
  { key: 'me', label: 'Me', icon: User },
]

const MANAGER_TABS = [
  { key: 'today', label: 'Crew', icon: Users },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'report', label: 'Report', icon: FileText },
  { key: 'me', label: 'Me', icon: User },
]

const ROOT_VIEWS = new Set(['today', 'map', 'jobs', 'report', 'me'])

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
  // Set when a QR code was scanned. Held rather than acted on immediately,
  // because a first-time scanner still has to say who they are — and in a
  // ref, since it is consumed once and never rendered.
  const pendingJobRef = useRef(readDeepLinkJob())
  const [sync, setSync] = useState('saved')
  const [pending, setPending] = useState(0)
  const [undo, setUndo] = useState(null)
  // Guards the poll below. A write is optimistic on screen but takes a moment
  // to be readable back through the edge, so polling straight over it would
  // flash the old number — which looks exactly like the save failing.
  //
  // A flag cleared on a timer rather than a stored timestamp: the poll only
  // needs to know "was there a write just now", and a boolean says that
  // without reading the clock in the render path.
  const [justSaved, setJustSaved] = useState(false)
  const [notice, setNotice] = useState(null)
  // Which way the last navigation went, so the incoming screen can slide
  // from the right side of the one it replaced.
  const [anim, setAnim] = useState('nav-fade')
  const viewNameRef = useRef('today')

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
      // Resolved here rather than in an effect of its own, so the scanned
      // job opens in the same update that delivers the jobs — one render,
      // and no flash of the list before it jumps.
      if (pendingJobRef.current) {
        const wanted = pendingJobRef.current
        const match = list.find((j) => j.jobNumber === wanted || j.id === wanted)
        if (match) setView({ name: 'job', jobId: match.id })
        // Cleared either way: a code for a job this person cannot see should
        // not sit there re-firing on every load.
        clearDeepLinkJob()
        pendingJobRef.current = null
      }
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
    viewNameRef.current = 'today'
    setView({ name: 'today' })
  }

  // How deep each screen is, which is the only thing the push/pop animation
  // needs to know. Direction is decided where the navigation happens, not
  // inferred afterwards by comparing renders — a render that compares itself
  // to the last one is a render with a memory, and those go wrong the first
  // time React runs it twice.
  const navTo = useCallback((next) => {
    const DEPTH = { today: 0, map: 0, jobs: 0, report: 0, me: 0, job: 1, info: 2, history: 2, notes: 2, task: 2 }
    const from = DEPTH[viewNameRef.current] ?? 0
    const to = DEPTH[next.name] ?? 0
    setAnim(to > from ? 'nav-push' : to < from ? 'nav-pop' : 'nav-fade')
    viewNameRef.current = next.name
    setView(next)
  }, [])

  // Memoised because JobMap rebuilds its markers when this changes, and an
  // arrow function created during render is a different function every time.
  const openJob = useCallback((jobId) => navTo({ name: 'job', jobId }), [navTo])

  // Live sync. The screen reads once when it opens, which is fine for one
  // person and wrong for two: a job worked on by a pair should not need a
  // manual refresh to show what the other one just did.
  //
  // Polls ONE job — the one being looked at — not the whole list. Refreshing
  // everything costs a request per job, so a manager with thirty-one jobs
  // open would have fired about a hundred and twenty requests a minute,
  // which is both rude to an unauthenticated Worker and enough to burn
  // through Cloudflare's daily free allowance in an afternoon. Away from a
  // job screen there is nothing worth a fifteen-second refresh anyway.
  //
  // Skipped while hidden, just after a local write, or while anything is
  // queued: each of those would paint over a figure that has not been read
  // back yet, which looks exactly like a save being lost.
  const openJobId = view.name === 'job' || view.name === 'task' ? view.jobId : null

  useEffect(() => {
    if (!staff || !openJobId) return undefined
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (justSaved || pending > 0) return
      getJob(openJobId).then((fresh) => {
        if (!fresh) return
        setJobs((prev) =>
          prev.map((j) =>
            j.id === fresh.id
              ? { ...j, tasks: fresh.tasks, history: fresh.history, notes: fresh.notes }
              : j,
          ),
        )
      })
    }, 15000)
    return () => clearInterval(interval)
  }, [staff, openJobId, pending, justSaved])

  function signOut() {
    writeStaff(null)
    setStaff(null)
    setRole(null)
  }

  // Swapping between on-site and managing keeps the name — it is the same
  // person asking a different question, and making them re-pick themselves
  // out of eighteen to do it would be a punishment for curiosity.
  function switchRole() {
    const next = role === 'manager' ? 'worker' : 'manager'
    setRole(next)
    setStaff(writeStaff({ ...staff, role: next }))
    navTo({ name: 'today' })
  }

  const job = jobs.find((j) => j.id === view.jobId)
  const task = job?.tasks.find((t) => t.id === view.taskId)

  // Optimistic: the number changes the instant the chip is tapped, and the
  // badge — never the number — tells the truth about whether it landed.
  function markSaved() {
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 5000)
  }

  async function saveTask(nextTask, { pct, na }, previous) {
    const at = new Date().toISOString()
    setJobs((prev) =>
      prev.map((j) =>
        j.id !== job.id
          ? j
          : {
              ...j,
              tasks: j.tasks.map((t) =>
                t.id !== nextTask.id ? t : { ...t, pct, na, updatedBy: staff.name, updatedAt: at },
              ),
              // The history is updated optimistically too, not just the task.
              // Without this you could set a percentage, open History, and
              // not find your own change — it was written, but the screen was
              // still showing the record as it was fetched. The real entry
              // replaces this one on the next read.
              history: [
                { t: nextTask.id, from: previous.na ? null : previous.pct, to: pct, na, by: staff.name, at },
                ...(j.history ?? []),
              ],
            },
      ),
    )
    setUndo({ taskId: nextTask.id, previous, label: na ? 'Marked not applicable' : `Set to ${pct}%` })

    const op = { jobNumber: job.jobNumber, taskId: nextTask.id, pct, na, by: staff.name, at }
    if (!navigator.onLine) {
      setPending((await enqueue(op)).length)
      setSync('offline')
      return
    }
    setSync('saving')
    markSaved()
    try {
      await setTaskPercent(op)
      setSync('saved')
      markSaved()
    } catch {
      setPending((await enqueue(op)).length)
      setSync('offline')
    }
  }

  async function saveNote(text) {
    const at = new Date().toISOString()
    // Optimistic, same as a percentage: the note appears the moment it is
    // written, and the badge — never the note — says whether it left.
    setJobs((prev) =>
      prev.map((j) =>
        j.id !== job.id ? j : { ...j, notes: [{ text, by: staff.name, at }, ...(j.notes ?? [])] },
      ),
    )
    const op = { kind: 'note', jobNumber: job.jobNumber, text, by: staff.name, at }
    if (!navigator.onLine) {
      setPending((await enqueue(op)).length)
      setSync('offline')
      return
    }
    setSync('saving')
    markSaved()
    try {
      await addJobNote(op)
      setSync('saved')
      markSaved()
    } catch {
      setPending((await enqueue(op)).length)
      setSync('offline')
    }
  }

  async function attachPhoto(file) {
    // An object URL, not a data URL: a phone camera produces a few megabytes,
    // and base64 in React state is that again by a third, held twice.
    await addAttachment(job.id, task.id, {
      kind: 'photo',
      src: URL.createObjectURL(file),
      at: new Date().toISOString(),
      by: staff.name,
    })
    setReloadKey((n) => n + 1)
  }

  if (!role) return <RoleScreen onPick={setRole} />
  if (!staff) {
    return <StaffPickerScreen staff={roster} loading={rosterLoading} role={role} onPick={pickStaff} />
  }

  const tabs = role === 'manager' ? MANAGER_TABS : WORKER_TABS
  const isRoot = ROOT_VIEWS.has(view.name)

  const body = () => {
    if (view.name === 'me') {
      return (
        <MeScreen
          staff={staff}
          role={role}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSwitchStaff={signOut}
          onSwitchRole={switchRole}
        />
      )
    }
    if (view.name === 'today') {
      return role === 'manager' ? (
        <ManagerScreen section="crew" jobs={jobs} roster={roster} loading={jobsLoading} onOpenJob={openJob} />
      ) : (
        <TodayScreen jobs={jobs} loading={jobsLoading} onOpenJob={openJob} />
      )
    }
    if (view.name === 'jobs') {
      return <ManagerScreen section="jobs" jobs={jobs} roster={roster} loading={jobsLoading} onOpenJob={openJob} />
    }
    if (view.name === 'map') return <MapScreen jobs={jobs} loading={jobsLoading} onOpenJob={openJob} />
    if (view.name === 'report') return <ReportScreen jobs={jobs} roster={roster} />
    if (!job) return <SkeletonRows />
    if (view.name === 'job') {
      return (
        <JobTasksScreen
          job={job}
          onOpenTask={(taskId) => navTo({ name: 'task', jobId: job.id, taskId })}
          onOpenInfo={() => navTo({ name: 'info', jobId: job.id })}
          onOpenHistory={() => navTo({ name: 'history', jobId: job.id })}
          onOpenNotes={() => navTo({ name: 'notes', jobId: job.id })}
        />
      )
    }
    if (view.name === 'info') return <JobInfoScreen job={job} />
    if (view.name === 'history') return <JobHistoryScreen job={job} />
    if (view.name === 'notes')
      return <JobNotesScreen job={job} onAddNote={saveNote} saving={sync === 'saving'} />
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
          history={(job.history ?? []).filter((e) => e.t === task.id)}
          onAttachPhoto={attachPhoto}
          onOpenNotes={() => navTo({ name: 'notes', jobId: job.id })}
        />
      )
    }
    return <SkeletonRows />
  }

  // A root screen gets the big title; a pushed one gets it inline in the bar.
  // Pushed titles are also longer — a job number plus a job name — which is
  // the other half of the reason they are not set 30px.
  const titles = {
    today: role === 'manager' ? { title: 'Crew' } : { title: 'Today' },
    jobs: { title: 'Jobs' },
    map: { title: 'Map' },
    report: { title: 'Meeting report' },
    me: { title: 'Me' },
    job: { title: job ? `${job.jobNumber} ${job.jobName}` : 'Job' },
    info: { title: 'Job info', subtitle: job?.jobName },
    history: { title: 'History', subtitle: job?.jobName },
    notes: { title: 'Handover notes', subtitle: job?.jobName },
    task: { title: job ? job.jobName : 'Task' },
  }

  // Root screens have no back: the way out of a tab is another tab, and a
  // chevron next to a tab bar is an invitation to a dead end.
  const back = isRoot
    ? null
    : {
        job: () => navTo({ name: 'today' }),
        info: () => navTo({ name: 'job', jobId: view.jobId }),
        history: () => navTo({ name: 'job', jobId: view.jobId }),
        notes: () => navTo({ name: 'job', jobId: view.jobId }),
        task: () => navTo({ name: 'job', jobId: view.jobId }),
      }[view.name]

  return (
    <>
      <Screen
        {...titles[view.name]}
        largeTitle={isRoot}
        onBack={back}
        animation={anim}
        scrollKey={`${view.name}:${view.jobId ?? ''}:${view.taskId ?? ''}`}
        tabs={isRoot ? tabs : undefined}
        currentTab={view.name}
        onSelectTab={(key) => navTo({ name: key })}
        actions={<SyncBadge status={sync} pending={pending} />}
      >
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
