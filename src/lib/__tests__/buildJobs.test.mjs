import test from 'node:test'
import assert from 'node:assert/strict'
import { buildJob, buildJobs } from '../buildJobs.js'

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
