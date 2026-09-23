import test from 'node:test'
import assert from 'node:assert/strict'
import { buildJob, buildJobs, applySiteTaskOverrides } from '../buildJobs.js'

const TEMPLATES = {
  commercial: [
    { id: 'rough-in', label: 'Rough-in', order: 2 },
    { id: 'site-set-up', label: 'Site set-up', order: 1 },
  ],
  residential: [{ id: 'rewire', label: 'Rewire', order: 1 }],
}

test('a job keeps the office numbers and name', () => {
  const job = buildJob({ jobNumber: '8183', jobName: 'Murney - 1 Freight Drive' }, TEMPLATES)
  assert.equal(job.id, '8183')
  assert.equal(job.jobNumber, '8183')
  assert.equal(job.jobName, 'Murney - 1 Freight Drive')
})

test('a job with no type gets no tasks, rather than a guessed checklist', () => {
  const job = buildJob({ jobNumber: '8183', jobName: 'X' }, TEMPLATES)
  assert.equal(job.type, null)
  assert.deepEqual(job.tasks, [])
})

test('a typed job gets that checklist, in order', () => {
  const job = buildJob({ jobNumber: '1', jobName: 'X', type: 'commercial' }, TEMPLATES)
  assert.deepEqual(job.tasks.map((t) => t.id), ['site-set-up', 'rough-in'])
  assert.deepEqual(job.tasks.map((t) => t.name), ['Site set-up', 'Rough-in'])
})

test('an unrecognised type is treated as no type, not passed through', () => {
  for (const type of ['COMMERCIAL', 'industrial', '', null, 42]) {
    const job = buildJob({ jobNumber: '1', jobName: 'X', type }, TEMPLATES)
    assert.equal(job.type, null)
    assert.deepEqual(job.tasks, [])
  }
})

// The whole point of this module: absent, never invented.
test('nothing the office does not have is made up', () => {
  const job = buildJob({ jobNumber: '1', jobName: 'X' }, TEMPLATES)
  assert.deepEqual(job.site, {})
  assert.deepEqual(job.dates, {})
  for (const field of ['scope', 'supply', 'switchboardLocation', 'inductionRequired']) {
    assert.equal(job[field], null, `${field} should be absent, not invented`)
  }
})

// Shape, not just emptiness. The screens iterate these and read through them
// without checking first, so a null here is a crash on the job screen rather
// than a blank field — which is exactly how this was found.
test('empty fields keep the type their screen expects', () => {
  const job = buildJob({ jobNumber: '1', jobName: 'X' }, TEMPLATES)
  for (const field of ['contacts', 'hazards', 'notes', 'visits', 'history', 'tasks']) {
    assert.ok(Array.isArray(job[field]), `${field} must be an array`)
    assert.equal(job[field].length, 0)
  }
  // Read as job.site.address and job.dates.start with no guard.
  assert.equal(typeof job.site, 'object')
  assert.notEqual(job.site, null)
  assert.equal(job.site.address, undefined)
  assert.equal(job.dates.start, undefined)
})

test('a list that arrives as something other than a list is emptied, not passed on', () => {
  const job = buildJob({ jobNumber: '1', jobName: 'X', contacts: 'nope', hazards: null }, TEMPLATES)
  assert.deepEqual(job.contacts, [])
  assert.deepEqual(job.hazards, [])
})

test('a site is used when the office actually has one', () => {
  const site = { address: '1 Real Street', lat: -43.5, lng: 172.6 }
  const job = buildJob({ jobNumber: '1', jobName: 'X', site }, TEMPLATES)
  assert.deepEqual(job.site, site)
})

test('a row with no job number is skipped rather than rendered blank', () => {
  const jobs = buildJobs(
    [{ jobNumber: '1', jobName: 'A' }, { jobName: 'no number' }, { jobNumber: '', jobName: 'B' }],
    TEMPLATES,
  )
  assert.equal(jobs.length, 1)
  assert.equal(jobs[0].jobNumber, '1')
})

test('a job with no name still shows something identifiable', () => {
  assert.equal(buildJob({ jobNumber: '9412' }, TEMPLATES).jobName, 'Job 9412')
})

test('a missing or broken list is empty, not a crash', () => {
  for (const bad of [null, undefined, 'nope', {}, 42]) {
    assert.deepEqual(buildJobs(bad, TEMPLATES), [])
  }
})

// Tasks arrive blank. Recorded progress is applied by mergeRecordedProgress
// against the same KV record, and having two places that know the rule is how
// they end up disagreeing.
test('tasks are built blank, for the merge step to fill in', () => {
  const job = buildJob({ jobNumber: '1', jobName: 'X', type: 'commercial' }, TEMPLATES)
  for (const task of job.tasks) {
    assert.equal(task.pct, null)
    assert.equal(task.na, false)
    assert.equal(task.updatedBy, null)
  }
})

test('a job number that arrives as a number still works', () => {
  assert.equal(buildJobs([{ jobNumber: 8183, jobName: 'X' }], TEMPLATES)[0].jobNumber, '8183')
})

// The Today screen groups by this. It went missing once already: the publish
// script was writing it and buildJob was quietly dropping it, so every job
// landed in "No type set" while the data was right all along.
test('the category comes through for the list to group on', () => {
  const job = buildJob(
    { jobNumber: '1', jobName: 'X', category: 'Commercial New Build', type: 'commercial' },
    TEMPLATES,
  )
  assert.equal(job.category, 'Commercial New Build')
})

test('a missing or odd category is an empty string, not undefined', () => {
  for (const category of [undefined, null, 42, {}]) {
    assert.equal(buildJob({ jobNumber: '1', category }, TEMPLATES).category, '')
  }
  assert.equal(buildJob({ jobNumber: '1', category: '  Solar  ' }, TEMPLATES).category, 'Solar')
})

// The crew can add hazards on site, and those carry a name and a time the
// office's plain strings do not. One shape for both, so the screen never has
// to ask which kind it is holding before it can render it.
test('office hazards become objects, marked as the office', () => {
  const job = buildJob(
    { jobNumber: '1', jobName: 'X', hazards: ['Live board', 'Open trench'] },
    TEMPLATES,
  )
  assert.deepEqual(job.hazards, [
    { id: null, text: 'Live board', by: null, at: null, source: 'office' },
    { id: null, text: 'Open trench', by: null, at: null, source: 'office' },
  ])
})

// Only a hazard added on site can be removed on site, and the screen decides
// that from `source` and `id`. An office hazard arriving with either set
// would put a Remove button on something this screen cannot remove.
test('an office hazard never arrives removable', () => {
  const job = buildJob({ jobNumber: '1', jobName: 'X', hazards: ['Live board'] }, TEMPLATES)
  assert.equal(job.hazards[0].source, 'office')
  assert.equal(job.hazards[0].id, null)
})

test('a hazard already published as an object keeps its text', () => {
  const job = buildJob(
    { jobNumber: '1', jobName: 'X', hazards: [{ text: 'Asbestos in ceiling' }] },
    TEMPLATES,
  )
  assert.equal(job.hazards[0].text, 'Asbestos in ceiling')
  assert.equal(job.hazards[0].source, 'office')
})

// Per-job checklist customization — the office half (buildJob) and the site
// half (applySiteTaskOverrides), and the precedence between them.

test('with no overrides, the template is unaffected', () => {
  const job = buildJob({ jobNumber: '1', jobName: 'X', type: 'commercial' }, TEMPLATES, null)
  assert.deepEqual(job.tasks.map((t) => t.name), ['Site set-up', 'Rough-in'])
})

test('an office override reworks one task and leaves the rest alone', () => {
  const overrides = { overrides: { 'rough-in': 'Rough-in (basement level only)' }, extra: [] }
  const job = buildJob({ jobNumber: '1', jobName: 'X', type: 'commercial' }, TEMPLATES, overrides)
  assert.deepEqual(job.tasks.map((t) => t.name), ['Site set-up', 'Rough-in (basement level only)'])
})

test('an office extra task is appended after the template, in order added', () => {
  const overrides = {
    overrides: {},
    extra: [
      { id: 'office-1', label: 'Confirm supply authority sign-off' },
      { id: 'office-2', label: 'Book crane for the day' },
    ],
  }
  const job = buildJob({ jobNumber: '1', jobName: 'X', type: 'commercial' }, TEMPLATES, overrides)
  assert.deepEqual(job.tasks.map((t) => t.id), ['site-set-up', 'rough-in', 'office-1', 'office-2'])
  assert.deepEqual(job.tasks.slice(2).map((t) => t.name), [
    'Confirm supply authority sign-off',
    'Book crane for the day',
  ])
})

// A blank task's shape matters as much as its content — the screens iterate
// attachments/pct/na without checking first, per buildJobs.js's own comment.
// An extra task skipping blankTask() would crash the first screen that reads it.
test('an office extra task has the same blank shape as a template task', () => {
  const overrides = { overrides: {}, extra: [{ id: 'office-1', label: 'Extra step' }] }
  const job = buildJob({ jobNumber: '1', jobName: 'X', type: 'commercial' }, TEMPLATES, overrides)
  const extra = job.tasks.find((t) => t.id === 'office-1')
  assert.deepEqual(extra, {
    id: 'office-1',
    name: 'Extra step',
    area: 'Added for this job',
    pct: null,
    na: false,
    updatedBy: null,
    updatedAt: null,
    attachments: [],
  })
})

test('buildJobs threads each job its own overrides by job number', () => {
  const overridesByJob = { 1: { overrides: { 'rough-in': 'Reworded for job 1' }, extra: [] } }
  const [job1, job2] = buildJobs(
    [
      { jobNumber: '1', jobName: 'A', type: 'commercial' },
      { jobNumber: '2', jobName: 'B', type: 'commercial' },
    ],
    TEMPLATES,
    overridesByJob,
  )
  assert.equal(job1.tasks.find((t) => t.id === 'rough-in').name, 'Reworded for job 1')
  assert.equal(job2.tasks.find((t) => t.id === 'rough-in').name, 'Rough-in')
})

test('applySiteTaskOverrides: no record leaves the tasks untouched', () => {
  const job = buildJob({ jobNumber: '1', jobName: 'X', type: 'commercial' }, TEMPLATES, null)
  assert.deepEqual(applySiteTaskOverrides(job.tasks, null), job.tasks)
})

test('applySiteTaskOverrides: a site override wins over the office one', () => {
  const officeOverrides = { overrides: { 'rough-in': 'Office wording' }, extra: [] }
  const job = buildJob({ jobNumber: '1', jobName: 'X', type: 'commercial' }, TEMPLATES, officeOverrides)
  const record = { taskOverrides: { 'rough-in': { label: 'Site wording', by: 'Andy' } } }
  const merged = applySiteTaskOverrides(job.tasks, record)
  assert.equal(merged.find((t) => t.id === 'rough-in').name, 'Site wording')
  // The office's own override on a DIFFERENT task is untouched by a site
  // edit on this one — this is the case that would silently regress if the
  // merge ever stopped being per-task.
  assert.equal(merged.find((t) => t.id === 'site-set-up').name, 'Site set-up')
})

test('applySiteTaskOverrides: a site extra task is appended after office extras', () => {
  const officeOverrides = { overrides: {}, extra: [{ id: 'office-1', label: 'Office step' }] }
  const job = buildJob({ jobNumber: '1', jobName: 'X', type: 'commercial' }, TEMPLATES, officeOverrides)
  const record = { extraTasks: [{ id: 'extra-1', label: 'Site step' }] }
  const merged = applySiteTaskOverrides(job.tasks, record)
  assert.deepEqual(merged.map((t) => t.id), ['site-set-up', 'rough-in', 'office-1', 'extra-1'])
})

test('a site-added extra task gets the same blank shape as any other task', () => {
  const job = buildJob({ jobNumber: '1', jobName: 'X', type: 'commercial' }, TEMPLATES, null)
  const record = { extraTasks: [{ id: 'extra-1', label: 'Site step' }] }
  const merged = applySiteTaskOverrides(job.tasks, record)
  const extra = merged.find((t) => t.id === 'extra-1')
  assert.deepEqual(extra, {
    id: 'extra-1',
    name: 'Site step',
    area: 'Added for this job',
    pct: null,
    na: false,
    updatedBy: null,
    updatedAt: null,
    attachments: [],
  })
})

test('office and site extras on the same job coexist without colliding ids', () => {
  const officeOverrides = { overrides: {}, extra: [{ id: 'office-1', label: 'Office step' }] }
  const job = buildJob({ jobNumber: '1', jobName: 'X', type: 'commercial' }, TEMPLATES, officeOverrides)
  const record = { extraTasks: [{ id: 'extra-1', label: 'Site step' }] }
  const merged = applySiteTaskOverrides(job.tasks, record)
  assert.equal(new Set(merged.map((t) => t.id)).size, merged.length)
})
