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

// Office-authored customization: reword a template task for this job, or add
// a task specific to it, before anything about progress or the crew's own
// edits enters the picture. `overrides` is one job's entry from
// planning:field-checklist-overrides — { overrides: {taskId: label}, extra:
// [{id, label}] } — read live by loadJobs() in dataSource.js, the same way
// planning:job-details already is.
//
// The 21-task template itself is never touched — only this job's own copy of
// it. A rename here never reaches another job, and never reaches this same
// job's next re-publish either: the template stays the shared default, this
// is a layer on top of it.
function withOfficeChecklist(template, overrides) {
  const labelOverrides = overrides?.overrides ?? {}
  const extra = Array.isArray(overrides?.extra) ? overrides.extra : []

  const templated = Array.isArray(template)
    ? [...template]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((t) => (labelOverrides[t.id] ? { ...t, label: labelOverrides[t.id] } : t))
    : []

  // Appended after the template, in the order the office added them — same
  // ordering rule already used for hazards (office first, then site), so
  // the list reads as a continuation rather than an unexplained reshuffle.
  // Given a real area rather than null: the task screen groups by area, and
  // null grouped these under a blank heading instead of one that says what
  // they are.
  const extraTasks = extra.map((t) => ({ id: t.id, label: t.label, area: 'Added for this job' }))

  return [...templated, ...extraTasks]
}

// The crew's own edits, layered on top of the office-built list once this
// job's own field:<job> record is available — see mergeRecordedProgress in
// dataSource.js, the only caller. Site wins over office on the same task id:
// the person standing there is the more current source, the same precedent
// already set for switchboard, supply and induction.
//
// A site-added extra task is appended as a normal blank task, not a special
// kind of row — it goes through the exact same pct/na merge afterwards as
// every other task, because recording progress against a task someone added
// this morning is not a different feature from recording it against one of
// the 21.
export function applySiteTaskOverrides(tasks, record) {
  const siteOverrides = record?.taskOverrides ?? {}
  const siteExtra = Array.isArray(record?.extraTasks) ? record.extraTasks : []

  const reworded = tasks.map((task) =>
    siteOverrides[task.id]?.label ? { ...task, name: siteOverrides[task.id].label } : task,
  )
  const extraTasks = siteExtra.map((t) =>
    blankTask({ id: t.id, label: t.label, area: 'Added for this job' }),
  )

  return [...reworded, ...extraTasks]
}

// `type` decides which checklist a job gets. Nothing in the workbook says
// which a job is, so it only ever arrives from someone setting it — until
// then the job has no tasks and says so.
export function buildJob(entry, templates = {}, checklistOverrides = null) {
  const jobNumber = String(entry?.jobNumber ?? '').trim()
  if (!jobNumber) return null

  const type = entry.type === 'commercial' || entry.type === 'residential' ? entry.type : null
  const template = type ? templates[type] : null

  const tasks = withOfficeChecklist(template, checklistOverrides).map(blankTask)

  const job = {
    id: jobNumber,
    jobNumber,
    jobName: String(entry.jobName ?? '').trim() || `Job ${jobNumber}`,
    type,
    // The kind of work, as set on the dashboard's Projects tab — "Commercial
    // New Build" rather than the "commercial" that `type` reduces it to for
    // choosing a checklist. The list screen groups by this, so the grouping
    // and the tasks inside a job can never disagree about what a job is.
    category: typeof entry.category === 'string' ? entry.category.trim() : '',
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
    // Normalised to objects here rather than left as the strings the office
    // publishes, because the crew can now add their own and those carry a
    // name and a time. One shape, so the screen does not have to ask which
    // kind of hazard it is holding before it can render it.
    //
    // `source` is what the screen shows attribution from and what decides
    // whether a hazard can be removed on site: an office one is deleted
    // where it was written, not by whoever happens to be standing there.
    hazards: toList(entry.hazards).map((h) =>
      typeof h === 'string'
        ? { id: null, text: h, by: null, at: null, source: 'office' }
        : { id: null, by: null, at: null, source: 'office', ...h },
    ),
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
export function buildJobs(list, templates = {}, checklistOverridesByJob = {}) {
  if (!Array.isArray(list)) return []
  return list
    .map((entry) => buildJob(entry, templates, checklistOverridesByJob?.[String(entry?.jobNumber)]))
    .filter(Boolean)
}
