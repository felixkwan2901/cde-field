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

// What share of the job each group of tasks accounts for.
//
// The job percentage is an unweighted mean over the tasks that count, so
// every counted task is worth exactly the same slice of the job — 100/n.
// An area's share is therefore just how many of the counted tasks live in
// it. Nothing is invented: this is the arithmetic the ring already does,
// made visible.
//
// N/A tasks are worth nothing here, as everywhere else. A house has no DALI,
// and giving it a share would hold every residential figure permanently and
// wrongly down.
//
// Largest remainder, so the shares add to exactly 100 rather than to 99.
// Three areas of five tasks each are 33.3% apiece; rounded independently
// that is 33 + 33 + 33, and a column of percentages that visibly fails to
// total 100 is the kind of thing that costs a number its credibility.
export function groupShares(groups) {
  const counts = groups.map((tasks) => (tasks ?? []).filter(isCounted).length)
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return counts.map(() => null)

  const exact = counts.map((n) => (n / total) * 100)
  const floors = exact.map(Math.floor)
  let left = 100 - floors.reduce((a, b) => a + b, 0)

  // Hand the leftover points to the biggest fractional parts first, largest
  // first, so the rounding error lands where it is proportionally smallest.
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)

  const out = [...floors]
  for (const { i } of order) {
    if (left <= 0) break
    out[i] += 1
    left -= 1
  }
  return out
}
