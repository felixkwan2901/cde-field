import { JOBS } from '../mocks/jobs'
import { STAFF } from '../mocks/staff'
import { readKey, writeKey } from './workerClient'

// THE SEAM. This is the only module allowed to import from ../mocks.
//
// Everything else in the app calls these five functions and cannot tell
// which parts are real. Making it real later is editing four function
// bodies. The pattern to never introduce is `if (USE_MOCKS)` inside a
// component — that is how a prototype becomes unshippable.
//
// Today: the staff list and every progress write are real; the jobs are
// fixtures.

// A deliberate delay on the mocked reads, so the loading and skeleton states
// are exercised on every use rather than being untested code that appears
// for the first time on a bad connection.
const settle = (value, ms = 300) => new Promise((resolve) => setTimeout(() => resolve(value), ms))

export async function listStaff() {
  try {
    const roster = await readKey('planning:staff-roster')
    if (Array.isArray(roster) && roster.length) {
      return roster.map(({ id, name }) => ({ id, name })).filter((s) => s.name?.trim())
    }
  } catch {
    // Fall through. A demo that dies because the office wifi dropped is a
    // worse failure than a demo showing six names instead of eighteen.
  }
  return settle(STAFF)
}

export async function listJobsForStaff(staffId) {
  const mine = JOBS.filter((job) => job.assignedStaffIds.includes(staffId))
  // Someone redirected mid-morning is a real case, so an unassigned person
  // sees everything rather than an empty screen they cannot get past.
  const jobs = mine.length ? mine : JOBS
  return withProgress(await settle(jobs))
}

export async function getJob(jobId) {
  const job = JOBS.find((j) => j.id === jobId)
  if (!job) return null
  const merged = await mergeRecordedProgress(job)
  return settle(merged, 200)
}

// Recorded progress lives in KV keyed by job; the task list and its labels
// come from the fixture. Merging on task id rather than position is the
// whole reason ids are slugs — reordering the list must never re-point a
// percentage someone recorded.
async function mergeRecordedProgress(job) {
  let record = null
  try {
    record = await readKey(`field:${job.jobNumber}`)
  } catch {
    // Offline or the Worker is down: show the plan without the progress
    // rather than showing nothing.
  }
  if (!record?.tasks) return job
  return {
    ...job,
    tasks: job.tasks.map((task) => {
      const saved = record.tasks[task.id]
      return saved ? { ...task, pct: saved.pct, na: !!saved.na, updatedBy: saved.by, updatedAt: saved.at } : task
    }),
  }
}

async function withProgress(jobs) {
  return Promise.all(jobs.map((job) => mergeRecordedProgress(job)))
}

// The one genuinely real write. Read-modify-write immediately before the
// POST rather than sending the screen's copy: two electricians on one site
// both on their phones is the normal case, and sending in-memory state would
// revert whatever the other one changed while this screen was open. This
// narrows the window from minutes to the few hundred milliseconds between
// the read and the write. It is not a fix — KV has no compare-and-set — but
// it removes almost all of the real collisions.
export async function setTaskPercent({ jobNumber, taskId, pct, na = false, by }) {
  const key = `field:${jobNumber}`
  let record
  try {
    record = await readKey(key)
  } catch {
    record = null
  }
  const at = new Date().toISOString()
  const previous = record?.tasks?.[taskId]?.pct ?? null

  const next = {
    v: 1,
    jobNumber: String(jobNumber),
    ...record,
    updatedAt: at,
    tasks: { ...(record?.tasks ?? {}), [taskId]: { pct, na, by, at } },
    // A bounded ring buffer, so a job worked on all year cannot grow the
    // record without limit. Fifty is enough to answer "who moved this and
    // when" and nowhere near the Worker's 100,000-character cap.
    log: [...(record?.log ?? []), { t: taskId, from: previous, to: pct, by, at }].slice(-50),
  }

  await writeKey(key, next)
  return next
}

// Faked, as agreed: real capture is HEIC conversion, EXIF orientation,
// downscaling, an upload route and quota handling, all to produce the same
// rectangle on the screen. Stored in memory only — it does not survive a
// reload, and the button says so.
export async function addAttachment(jobId, taskId, attachment) {
  const job = JOBS.find((j) => j.id === jobId)
  const task = job?.tasks.find((t) => t.id === taskId)
  if (!task) return null
  task.attachments = [...task.attachments, { id: `att-${Date.now()}`, ...attachment }]
  return settle(task.attachments, 400)
}
