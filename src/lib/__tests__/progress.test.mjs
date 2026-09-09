import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dayProgress, jobProgress, progressCaption } from '../progress.js'

const task = (pct, extra = {}) => ({ id: String(Math.random()), pct, ...extra })

test('a job with no tasks is not a job at 0%', () => {
  const p = jobProgress([])
  assert.equal(p.state, 'no-data')
  assert.equal(p.percent, null, '0% is a claim about work; this is the absence of a plan')
  assert.equal(progressCaption(p), 'Not broken down yet')
})

test('a job whose only tasks are N/A has nothing to measure', () => {
  const p = jobProgress([task(null, { na: true }), task(null, { na: true })])
  assert.equal(p.state, 'no-data')
  assert.equal(p.percent, null)
})

test('tasks that exist but are untouched are 0%, not absent', () => {
  const p = jobProgress([task(null), task(null)])
  assert.equal(p.state, 'zero')
  assert.equal(p.percent, 0)
  assert.equal(progressCaption(p), 'Not started')
})

test('N/A tasks are excluded from the average, not counted as zero', () => {
  // Without the exclusion this would be 50%, and every residential job would
  // sit permanently low because it has no DALI and no generator.
  const p = jobProgress([task(100), task(null, { na: true })])
  assert.equal(p.percent, 100)
  assert.equal(p.total, 1)
})

test('the average is unweighted across counted tasks', () => {
  assert.equal(jobProgress([task(0), task(50), task(100)]).percent, 50)
  assert.equal(jobProgress([task(25), task(75)]).percent, 50)
})

test('never rounds up to 100 unless every task really is done', () => {
  const nearly = [task(100), task(100), task(100), task(99)]
  assert.equal(jobProgress(nearly).percent, 99, '99.75 must not read as finished')
  const done = [task(100), task(100)]
  assert.equal(jobProgress(done).percent, 100)
  assert.equal(jobProgress(done).state, 'complete')
})

test('never rounds down to 0 once something has started', () => {
  // 1 of 300 percentage points across 30 tasks is 0.03% — still "someone has
  // started", which is the information.
  const barely = [task(1), ...Array.from({ length: 29 }, () => task(0))]
  assert.equal(jobProgress(barely).percent, 1)
  assert.equal(jobProgress(barely).state, 'progress')
})

test('started counts tasks above zero, not tasks that exist', () => {
  const p = jobProgress([task(60), task(0), task(null), task(10)])
  assert.equal(p.started, 2)
  assert.equal(p.total, 4)
  assert.equal(progressCaption(p), '2 of 4 tasks started')
})

test('the day roll-up pools tasks rather than averaging job averages', () => {
  const bigJob = { tasks: Array.from({ length: 9 }, () => task(0)) }
  const tinyJob = { tasks: [task(100)] }
  // Averaging the two jobs' percentages would give 50%. Pooling gives 10%,
  // which is what one task out of ten actually being done looks like.
  assert.equal(dayProgress([bigJob, tinyJob]).percent, 10)
})

test('an empty day is no-data, not zero', () => {
  assert.equal(dayProgress([]).state, 'no-data')
  assert.equal(dayProgress([{ tasks: [] }]).state, 'no-data')
})
