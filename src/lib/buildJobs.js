// Turning what the office actually has into what this app needs.
//
// The office has a job number and a job name, and that is genuinely all —
// there is no address column anywhere in the workbook, no commercial /
// residential marker, and no record of which electrician is on which job.
// This module is where that shortfall is handled honestly rather than papered
// over with plausible-looking filler.
//
// The rule it follows: a field that is not known is absent, not invented. A
// job with no address has no site block, so the map shows nothing for it
// rather than a pin in the wrong street. A job with no type has no task list,
// so it reads "not broken down yet" — which is true — rather than being given
// the commercial checklist on the assumption that most jobs are commercial.
//
// That makes the app emptier than the fixtures did. It also makes everything
// on screen true, which is the only version worth putting in front of an
// electrician who is about to act on it.

// A blank task, as the app expects one. Recorded progress is NOT applied here
// — mergeRecordedProgress in dataSource.js already does that, against the
// same KV record, and two implementations of one rule is how they drift.
function blankTask(template) {
  return {
    id: template.id,
    name: template.label,
    area: template.area ?? null,
    pct: null,
    na: false,
    updatedBy: null,
    updatedAt: null,
    attachments: [],
  }
}

const toList = (v) => (Array.isArray(v) ? v : [])

// `type` decides which checklist a job gets. Nothing in the workbook says
// which a job is, so it only ever arrives from someone setting it — until
// then the job has no tasks and says so.
export function buildJob(entry, templates = {}) {
  const jobNumber = String(entry?.jobNumber ?? '').trim()
  if (!jobNumber) return null

  const type = entry.type === 'commercial' || entry.type === 'residential' ? entry.type : null
  const template = type ? templates[type] : null

  const tasks = Array.isArray(template)
    ? [...template].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(blankTask)
    : []

  const job = {
    id: jobNumber,
    jobNumber,
    jobName: String(entry.jobName ?? '').trim() || `Job ${jobNumber}`,
    type,
    tasks,
    // Everything below is empty rather than guessed, and the shape matters as
    // much as the emptiness: the screens iterate the lists and read through
    // the objects without checking first, so `null` here is a crash on the
    // job screen, not a blank field. Empty collection, empty object, absent
    // scalar — each field keeps the type its consumer expects.
    //
    // Field() renders nothing for a falsy value, so an empty object reads as
    // "nothing recorded" everywhere it is displayed, and the map filters on
    // a numeric lat, so a job with no site simply does not get a pin.
    site: entry.site ?? {},
    dates: entry.dates ?? {},
    contacts: toList(entry.contacts),
    hazards: toList(entry.hazards),
    notes: toList(entry.notes),
    visits: toList(entry.visits),
    history: toList(entry.history),
    scope: entry.scope ?? null,
    supply: entry.supply ?? null,
    switchboardLocation: entry.switchboardLocation ?? null,
    inductionRequired: entry.inductionRequired ?? null,
  }

  return job
}

// The published list, in the order the office put it in, skipping anything
// without a job number rather than rendering a blank row.
export function buildJobs(list, templates = {}) {
  if (!Array.isArray(list)) return []
  return list.map((entry) => buildJob(entry, templates)).filter(Boolean)
}
