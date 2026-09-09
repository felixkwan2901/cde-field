// The arithmetic behind every ring and bar in the app.
//
// Kept in one file with a test because it is the only logic here where a
// wrong answer is invisible: a bar at 40% looks exactly as convincing as a
// bar at 60%, so nothing on screen will ever tell you it is lying.

// A task nobody can do on this job — no DALI in a house — is excluded from
// the average entirely. If N/A counted as zero, every residential job would
// sit permanently and wrongly low, and the number would be dismissed inside
// a week.
export function isCounted(task) {
  return !task.na
}

// Unweighted mean of the tasks that count, and labelled that way wherever it
// is shown. Weighting by hours is the obvious next idea and the wrong one
// here: there are no per-task quoted hours to weight by, and an honest
// unweighted average beats a weighted one built on invented weights.
//
// A task that exists but has never been touched counts as 0, not as absent —
// it is real work that is not done. "Started" is reported separately so the
// two are never confused.
export function jobProgress(tasks) {
  const all = tasks ?? []
  const counted = all.filter(isCounted)

  if (all.length === 0) return { state: 'no-data', percent: null, started: 0, total: 0 }
  if (counted.length === 0) return { state: 'no-data', percent: null, started: 0, total: 0 }

  const started = counted.filter((t) => typeof t.pct === 'number' && t.pct > 0).length
  const sum = counted.reduce((total, t) => total + (typeof t.pct === 'number' ? t.pct : 0), 0)
  const raw = sum / counted.length

  if (raw <= 0) return { state: 'zero', percent: 0, started: 0, total: counted.length }

  return {
    state: raw >= 100 ? 'complete' : 'progress',
    percent: displayPercent(raw, counted),
    started,
    total: counted.length,
  }
}

// Two clamps, both about not overstating.
//
// Never round up to 100: 100% here means "this job is finished", which is a
// stronger claim than 99.6 supports. Never round down to 0 either — that a
// job has been started at all is the information, and 0.4% rounding to "0%"
// throws it away. Same species of rule as the dashboard's -$0 clamp.
function displayPercent(raw, counted) {
  const everyTaskDone = counted.every((t) => t.pct === 100)
  if (raw >= 100) return everyTaskDone ? 100 : 99
  const rounded = Math.round(raw)
  if (rounded >= 100) return 99
  if (rounded <= 0) return 1
  return rounded
}

// The day roll-up pools every task across every assigned job rather than
// averaging the jobs' percentages. Averaging averages would let a two-task
// job weigh as much as a twenty-task one.
export function dayProgress(jobs) {
  return jobProgress((jobs ?? []).flatMap((job) => job.tasks ?? []))
}

// What the ring should say underneath itself. Kept here rather than in the
// component so the wording cannot drift between the day ring and a job card.
export function progressCaption(progress) {
  switch (progress.state) {
    case 'no-data':
      return 'Not broken down yet'
    case 'zero':
      return 'Not started'
    case 'complete':
      return 'All tasks complete'
    default:
      return `${progress.started} of ${progress.total} tasks started`
  }
}
