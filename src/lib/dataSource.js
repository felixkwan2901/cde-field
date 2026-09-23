import { STAFF } from '../mocks/staff'
import { buildJobs } from './buildJobs'
import { readKey, writeKey } from './workerClient'
import { JOB_DETAILS_KEY, applyJobDetails } from './jobDetails'

// THE SEAM. This is the only module allowed to import from ../mocks.
//
// Everything else in the app calls these five functions and cannot tell
// which parts are real. Making it real later is editing four function
// bodies. The pattern to never introduce is `if (USE_MOCKS)` inside a
// component — that is how a prototype becomes unshippable.
//
// Everything is real now. The jobs come from planning:field-jobs, published
// out of the workbook by scripts/publish-field-jobs.mjs in the dashboard
// repo; the checklists come from fieldTasks:<type>; the staff list and every
// progress write were already real.
//
// The fixtures are gone rather than kept as a fallback. A fallback here would
// mean an electrician on a bad connection quietly getting four invented jobs
// that look exactly like real ones, and recording progress against numbers
// that do not exist. An empty list with an error is the better failure.

// A deliberate delay on the mocked reads, so the loading and skeleton states
// are exercised on every use rather than being untested code that appears
// for the first time on a bad connection.
const settle = (value, ms = 300) => new Promise((resolve) => setTimeout(() => resolve(value), ms))

// Who is allowed to pick "I'm managing" — see App.jsx's pickStaff and
// switchRole for where this is enforced.
//
// UI GATE, NOT SECURITY. planning:field-jobs and planning:staff-roster are
// readable by anyone with this app's URL regardless of role, same as before
// this existed — this list only decides which SCREENS render, not what data
// reaches a device. Real protection is Cloudflare Access in front of the
// Worker, which this is not attempting to be.
//
// Deliberately does NOT fall back to a mock list on failure, unlike
// listStaff() below. A roster that fails open (defaulting to "everyone can
// see it") the moment the network drops would make the gate meaningless the
// one time it might matter; a roster that fails closed just means nobody
// reaches the manager view until the connection is back, which is the safe
// direction to be wrong in.
export async function listFieldAdmins() {
  try {
    const ids = await readKey('planning:field-admins')
    return new Set(Array.isArray(ids) ? ids.map(String) : [])
  } catch {
    return new Set()
  }
}

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

// The published list plus the two checklists, fetched together because a job
// without its template is a job with no tasks.
//
// Memoised for the life of the page: four reads, and paying for them on
// every tab switch is a cost the phone notices. It does mean an edit made in
// the office while somebody has the app open shows up when they next open it
// rather than instantly — which is the same as every other thing here, and
// the alternative is polling a phone on site data all day.
let jobsPromise = null

async function loadJobs() {
  if (!jobsPromise) {
    jobsPromise = (async () => {
      const [list, details, commercial, residential] = await Promise.all([
        readKey('planning:field-jobs'),
        // Read live rather than baked into the list above. A phone number
        // typed at a desk is on site the next time the app opens, with no
        // command for anyone to remember to run.
        readKey(JOB_DETAILS_KEY).catch(() => null),
        readKey('fieldTasks:commercial'),
        readKey('fieldTasks:residential'),
      ])
      return buildJobs(applyJobDetails(list, details), { commercial, residential })
    })().catch((err) => {
      // Not cached, so the next attempt tries again rather than being stuck
      // with a failure from the moment the van drove under a bridge.
      jobsPromise = null
      throw err
    })
  }
  return jobsPromise
}

// Nothing in the office records which electrician is on which job — the
// workbook has no such column and job-owners is the project owner, not the
// crew. So everyone sees every job.
//
// That was already the behaviour for anyone unassigned, and it is the safe
// direction to be wrong in: a missing job is someone unable to record work
// they did, while an extra job is a name they scroll past.
export async function listJobsForStaff() {
  return withProgress(await loadJobs())
}

// Every job, for the manager view. Identical for now, and kept separate
// because the day assignments exist the two stop being the same.
export async function listAllJobs() {
  return withProgress(await loadJobs())
}

export async function getJob(jobId) {
  const jobs = await loadJobs()
  const job = jobs.find((j) => j.id === jobId)
  if (!job) return null
  return mergeRecordedProgress(job)
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
  return {
    ...job,
    // Newest first, because a history is read from the top.
    //
    // Real entries and fixture ones are merged rather than one replacing the
    // other: the seeded chain is what happened before the demo started, and
    // anything tapped during it should slot in above without erasing the
    // backstory. Sorted by time, so the two interleave correctly.
    history: [...(record?.log ?? []), ...(job.seedHistory ?? [])].sort(
      (a, b) => new Date(b.at) - new Date(a.at),
    ),
    notes: [...(record?.notes ?? []), ...(job.seedNotes ?? [])].sort(
      (a, b) => new Date(b.at) - new Date(a.at),
    ),
    // Oldest first, unlike the other two: presence() replays them in order
    // to work out who is currently there, and sorting is its job anyway.
    visits: [...(record?.visits ?? []), ...(job.seedVisits ?? [])],
    // Office hazards first, then the ones found on site. Not sorted by time:
    // the office list is what you were told before you left, and a crew's
    // additions reading as a continuation of it is how somebody scanning the
    // screen expects it to go. Both carry `source`, so the screen can say
    // who found which.
    hazards: [
      ...job.hazards,
      ...(record?.siteInfo?.hazards ?? []).map((h) => ({ ...h, source: 'site' })),
    ],
    // A value entered on site beats the office's, because the person who
    // typed it was looking at the thing. Absent on site means fall back
    // rather than blank out — clearing the override is how you go back to
    // what the office said.
    inductionRequired: record?.siteInfo?.induction?.value ?? job.inductionRequired,
    switchboardLocation: record?.siteInfo?.switchboard?.value ?? job.switchboardLocation,
    supply: record?.siteInfo?.supply?.value ?? job.supply,
    // Who last set each of those, for the attribution line under it. Kept
    // separate from the values so every existing reader of `supply` keeps
    // getting a plain string.
    siteInfo: record?.siteInfo ?? {},
    tasks: job.tasks.map((task) => {
      const saved = record?.tasks?.[task.id]
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
    // record without limit.
    //
    // Two hundred rather than fifty, now that the history is actually shown:
    // a job with twenty tasks and three people revisiting them is through
    // fifty entries in a fortnight, and the whole point of the log is
    // answering "who moved this, and when" months later. An entry is about
    // 110 bytes, so two hundred is roughly 22KB against the Worker's
    // 100,000-character cap — still comfortable alongside the tasks.
    log: [...(record?.log ?? []), { t: taskId, from: previous, to: pct, na, by, at }].slice(-200),
  }

  await writeKey(key, next)
  return next
}

// A handover note on the job, so whoever turns up next knows where the last
// person got to. Kept as a list rather than one editable field on purpose:
// a single field is something two people overwrite, and "what did Ben say
// last week" is exactly the question a note is for.
//
// An append, which is why it needs no staleness check anywhere — unlike a
// percentage, a note written offline three hours ago is still true when it
// finally lands, whatever anyone else has added since.
export async function addJobNote({ jobNumber, text, fields, by, at = new Date().toISOString() }) {
  const key = `field:${jobNumber}`
  let record
  try {
    record = await readKey(key)
  } catch {
    record = null
  }
  const next = {
    v: 1,
    jobNumber: String(jobNumber),
    ...record,
    updatedAt: at,
    tasks: record?.tasks ?? {},
    // Capped at fifty. At 280 characters each that is about 17KB, which sits
    // comfortably beside the tasks and the change log inside the Worker's
    // 100,000-character limit on a value.
    // `text` is kept alongside the structured fields rather than replaced by
    // them: it is what the job screen's preview and every note written
    // before this change render from, and an app that stops showing old
    // notes because the form changed is a worse app than one with a
    // slightly redundant field.
    notes: [...(record?.notes ?? []), { text, ...(fields ? { fields } : {}), by, at }].slice(-50),
  }
  await writeKey(key, next)
  return next
}

// The fields on a job that only the person standing there knows: where the
// switchboard is, what the supply is, how you sign in.
//
// Editable on site rather than only in the office, because the office is
// guessing at all three and the electrician is looking at them. Kept in the
// job's own field: record, NOT in planning:field-jobs — that list is
// republished from the workbook every week, and anything written into it
// from a phone would be wiped by the next run.
export const SITE_FIELDS = ['induction', 'switchboard', 'supply']

// Last writer wins, and says who they were. Unlike a hazard or a note this
// is one value rather than a list, because there is one switchboard: a list
// would make somebody read three answers and work out which is current.
export async function setSiteField({ jobNumber, field, value, by, at = new Date().toISOString() }) {
  if (!SITE_FIELDS.includes(field)) throw new Error(`unknown site field: ${field}`)
  const key = `field:${jobNumber}`
  let record
  try {
    record = await readKey(key)
  } catch {
    record = null
  }
  const text = String(value ?? '').trim()
  const siteInfo = { ...(record?.siteInfo ?? {}) }
  // Clearing removes the override rather than storing a blank, so the job
  // falls back to whatever the office published instead of showing nothing.
  if (text) siteInfo[field] = { value: text, by, at }
  else delete siteInfo[field]

  const next = {
    v: 1,
    jobNumber: String(jobNumber),
    ...record,
    updatedAt: at,
    tasks: record?.tasks ?? {},
    siteInfo,
  }
  await writeKey(key, next)
  return next
}

// A hazard somebody found on site. An append, like a note, and for the same
// reason: it records something true at a moment, so nothing later makes it
// untrue and no staleness check is needed.
//
// `id` is generated by the caller rather than here, so an optimistic render
// and the stored row carry the same one and removing works before the write
// has landed.
export async function addSiteHazard({ jobNumber, id, text, by, at = new Date().toISOString() }) {
  const key = `field:${jobNumber}`
  let record
  try {
    record = await readKey(key)
  } catch {
    record = null
  }
  const next = {
    v: 1,
    jobNumber: String(jobNumber),
    ...record,
    updatedAt: at,
    tasks: record?.tasks ?? {},
    siteInfo: {
      ...(record?.siteInfo ?? {}),
      // Capped at thirty. A site with thirty live hazards on it has a
      // problem no list is going to fix, and at roughly 120 bytes each this
      // stays small beside the tasks and the log.
      hazards: [...(record?.siteInfo?.hazards ?? []), { id, text, by, at }].slice(-30),
    },
  }
  await writeKey(key, next)
  return next
}

// Removing one, for the mistyped entry. Only hazards added on site have an
// id, so only those can be removed here — an office hazard is deleted where
// it was written. A hazard is the one thing in this app worth making
// slightly harder to make disappear.
export async function removeSiteHazard({ jobNumber, id, at = new Date().toISOString() }) {
  const key = `field:${jobNumber}`
  let record
  try {
    record = await readKey(key)
  } catch {
    record = null
  }
  const next = {
    v: 1,
    jobNumber: String(jobNumber),
    ...record,
    updatedAt: at,
    tasks: record?.tasks ?? {},
    siteInfo: {
      ...(record?.siteInfo ?? {}),
      hazards: (record?.siteInfo?.hazards ?? []).filter((h) => h.id !== id),
    },
  }
  await writeKey(key, next)
  return next
}

// An arrival or a departure. An append, exactly like a note, and for the
// same reason: it records something that happened at a moment, so nothing
// later can make it untrue and nothing needs a staleness check.
//
// Deliberately NOT paired into sessions here. The record holds the stamps;
// working out who is on site now is presence.js's job, and keeping the two
// apart is what stops a "session" growing a duration the first time someone
// asks how long the crew was there. See the note at the top of presence.js.
export async function recordVisit({ jobNumber, action, by, at = new Date().toISOString() }) {
  const key = `field:${jobNumber}`
  let record
  try {
    record = await readKey(key)
  } catch {
    record = null
  }
  const next = {
    v: 1,
    jobNumber: String(jobNumber),
    ...record,
    updatedAt: at,
    tasks: record?.tasks ?? {},
    // Capped at a hundred. Two people arriving and leaving each day is four
    // entries, so a hundred is about five weeks of a two-hander — longer
    // than anyone looks back — and at roughly 70 bytes an entry it is 7KB
    // beside the tasks, the log and the notes inside the Worker's
    // 100,000-character limit.
    visits: [...(record?.visits ?? []), { action, by, at }].slice(-100),
  }
  await writeKey(key, next)
  return next
}

// Faked, as agreed: real capture is HEIC conversion, EXIF orientation,
// downscaling, an upload route and quota handling, all to produce the same
// rectangle on the screen. Stored in memory only — it does not survive a
// reload, and the button says so.
export async function addAttachment(jobId, taskId, attachment) {
  const jobs = await loadJobs()
  const job = jobs.find((j) => j.id === jobId)
  const task = job?.tasks.find((t) => t.id === taskId)
  if (!task) return null
  task.attachments = [...task.attachments, { id: `att-${Date.now()}`, ...attachment }]
  return settle(task.attachments, 400)
}
