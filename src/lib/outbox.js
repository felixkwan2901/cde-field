import { get, set } from 'idb-keyval'
import { setTaskPercent } from './dataSource'

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
  // should produce one write and one log entry, not three.
  const withoutTask = queue.filter((q) => !(q.jobNumber === op.jobNumber && q.taskId === op.taskId))
  const next = [...withoutTask, { id: crypto.randomUUID?.() ?? String(Date.now()), tries: 0, ...op }]
  await writeQueue(next)
  return next
}

// Returns { sent, skipped, failed }. `skipped` is the honest case: somebody
// else set that task more recently than this op, so the op is dropped and
// the caller tells the user rather than overwriting a newer figure.
export async function flush() {
  const queue = await readQueue()
  if (queue.length === 0) return { sent: 0, skipped: [], failed: 0 }

  const remaining = []
  const skipped = []
  let sent = 0

  for (const op of queue) {
    try {
      const record = await setTaskPercentIfNewer(op)
      if (record === 'stale') skipped.push(op)
      else sent += 1
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
