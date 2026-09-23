import { get, set } from 'idb-keyval'
import { addJobNote, addSiteHazard, recordVisit, removeSiteHazard, setSiteField, setTaskPercent } from './dataSource'

// Progress recorded with no signal, held until there is some.
//
// Stores OPERATIONS, not snapshots, and this is the crux of the whole
// design. A snapshot says "here is the job as my screen had it", so
// replaying one an hour later silently reverts whatever a colleague changed
// to a task this phone never touched. An op says "task A became 60% at
// 09:10" and carries no opinion whatsoever about task B.
//
// IndexedDB rather than localStorage: localStorage is synchronous and first
// in line for eviction, and this is the one thing whose entire job is not
// losing work.
const KEY = 'cdefield.outbox'

export async function readQueue() {
  try {
    return (await get(KEY)) ?? []
  } catch {
    return []
  }
}

async function writeQueue(ops) {
  try {
    await set(KEY, ops)
  } catch {
    // Nothing useful to do — the op stays in memory for this session.
  }
}

// `at` is stamped when the chip was tapped, not when the flush runs. That is
// what lets a late replay still order correctly against a colleague's change
// made while this phone was offline.
export async function enqueue(op) {
  const queue = await readQueue()
  // Collapse repeats of the same task: sliding 20 -> 40 -> 60 while offline
  // should produce one write and one log entry, not three. Notes are never
  // collapsed — each one is a separate thing somebody said.
  //
  // Notes and visits are never collapsed — each one is a separate thing that
  // happened. Collapsing two arrivals would erase a trip to site.
  // Hazards and the site fields join notes and visits here. A hazard is an
  // append like a note. A site field is an overwrite, but collapsing it with
  // the task rule below would be wrong — that rule matches on taskId, which
  // these do not have, so two different fields on one job would cancel each
  // other out. Collapsing them properly (same job, same field) is possible
  // and not worth it: nobody edits the switchboard location twice in one
  // offline stretch, and replaying both in order lands on the same answer.
  const isAppend = (o) =>
    o.kind === 'note' || o.kind === 'visit' || o.kind === 'hazard' ||
    o.kind === 'hazardRemove' || o.kind === 'siteField'
  const withoutTask = isAppend(op)
    ? queue
    : queue.filter(
        (q) => isAppend(q) || q.jobNumber !== op.jobNumber || q.taskId !== op.taskId,
      )
  const next = [...withoutTask, { id: crypto.randomUUID?.() ?? String(Date.now()), tries: 0, ...op }]
  await writeQueue(next)
  return next
}

// Returns { sent, skipped, failed }. `skipped` is the honest case: somebody
// else set that task more recently than this op, so the op is dropped and
// the caller tells the user rather than overwriting a newer figure.
// One place saying which op goes to which call, so adding a kind cannot
// leave it silently falling through to the task branch and being treated as
// a stale percentage.
const SENDERS = {
  note: addJobNote,
  visit: recordVisit,
  hazard: addSiteHazard,
  hazardRemove: removeSiteHazard,
  siteField: setSiteField,
}

export async function flush() {
  const queue = await readQueue()
  if (queue.length === 0) return { sent: 0, skipped: [], failed: 0 }

  const remaining = []
  const skipped = []
  let sent = 0

  for (const op of queue) {
    try {
      if (SENDERS[op.kind]) {
        // Appends need no staleness check: a note written three hours ago in
        // a basement is still true when it lands, whatever anyone has added
        // since, and so is "I arrived at 07:40" and "there is a live board
        // in here". Only overwrites can be stale.
        //
        // The site fields ride along despite being overwrites. Replaying one
        // late can put back a switchboard location somebody has since
        // changed — but the alternative is dropping what the person standing
        // on site typed because their phone had no signal, which is the
        // worse of the two, and the screen names who set it.
        await SENDERS[op.kind](op)
        sent += 1
      } else {
        const record = await setTaskPercentIfNewer(op)
        if (record === 'stale') skipped.push(op)
        else sent += 1
      }
    } catch {
      remaining.push({ ...op, tries: (op.tries ?? 0) + 1 })
    }
  }

  await writeQueue(remaining)
  return { sent, skipped, failed: remaining.length }
}

async function setTaskPercentIfNewer(op) {
  const { readKey } = await import('./workerClient')
  const record = await readKey(`field:${op.jobNumber}`)
  const existing = record?.tasks?.[op.taskId]
  // Strictly newer wins. Equal timestamps keep the remote value, because a
  // tie means this op has nothing newer to say.
  if (existing?.at && new Date(existing.at) > new Date(op.at)) return 'stale'
  await setTaskPercent(op)
  return record
}

// Flushing happens while the app is open, and the UI says so. Background
// Sync would be the textbook answer and iOS Safari does not implement it, so
// promising it would be a lie told to people standing in a basement.
export function startFlushing(onResult) {
  const run = async () => {
    if (!navigator.onLine) return
    const result = await flush()
    if (result.sent || result.skipped.length || result.failed) onResult?.(result)
  }
  run()
  const interval = setInterval(run, 30 * 1000)
  window.addEventListener('online', run)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') run()
  })
  return () => {
    clearInterval(interval)
    window.removeEventListener('online', run)
  }
}
