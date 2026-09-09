// What each person has actually recorded.
//
// Built from the attributions already on the tasks — the job record says who
// set each percentage and when — rather than from a separate activity log,
// which would only be a second thing to disagree with the first.
//
// Keyed on name because that is what the field app writes into `by`. Fine
// here (the roster's names are distinct, "Ben Dyer" and "Ben Ruffles"
// included), but it is a real limitation: two people sharing a full name
// would merge into one row. The proper fix is writing the staff id alongside
// the name, and it needs the id to survive into the record.
export function crewActivity(jobs, roster) {
  const stats = new Map()

  for (const job of jobs ?? []) {
    for (const task of job.tasks ?? []) {
      if (!task.updatedBy || !task.updatedAt) continue
      const at = new Date(task.updatedAt).getTime()
      const entry = stats.get(task.updatedBy) ?? { updates: 0, jobs: new Set(), last: null }
      entry.updates += 1
      entry.jobs.add(job.jobName)
      if (!entry.last || at > entry.last.at) {
        entry.last = { at, task: task.name, job: job.jobName, pct: task.pct }
      }
      stats.set(task.updatedBy, entry)
    }
  }

  // Everyone on the roster appears, not only the people who have recorded
  // something. Who has recorded *nothing* is the more useful half of this
  // list — a name with no activity is either someone who needs showing how
  // or a sign the app is not being used on that site.
  const named = (roster ?? []).map((person) => ({
    name: person.name,
    ...(stats.get(person.name) ?? { updates: 0, jobs: new Set(), last: null }),
  }))

  // Anyone who has recorded something but is not on the roster still shows —
  // the record is the evidence, and silently hiding it would be worse than
  // an unexpected name.
  const rosterNames = new Set(named.map((p) => p.name))
  const strays = [...stats.entries()]
    .filter(([name]) => !rosterNames.has(name))
    .map(([name, entry]) => ({ name, ...entry, offRoster: true }))

  return [...named, ...strays]
    .map((p) => ({ ...p, jobs: [...p.jobs] }))
    .sort((a, b) => {
      if (!a.last && !b.last) return a.name.localeCompare(b.name)
      if (!a.last) return 1
      if (!b.last) return -1
      return b.last.at - a.last.at
    })
}

export function lastTouched(job) {
  const times = (job.tasks ?? []).map((t) => t.updatedAt).filter(Boolean)
  return times.length ? Math.max(...times.map((t) => new Date(t).getTime())) : null
}
