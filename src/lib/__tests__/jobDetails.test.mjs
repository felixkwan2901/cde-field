// The office's typed-in details, read live and applied over the published
// job list. This is the half of the contract with the dashboard that this
// repo owns; the dashboard has the matching test against the same key names.
import test from 'node:test'
import assert from 'node:assert/strict'
import { JOB_DETAILS_KEY, applyJobDetails, splitHazards, toFieldJob } from '../jobDetails.js'

// Renaming one of these without renaming it in the dashboard does not break a
// build — it empties a screen silently. So the names are pinned on both sides.
test('the dashboard writes these exact key names', () => {
  const out = toFieldJob({
    contactName: 'n', contactRole: 'r', contactPhone: 'p', contactEmail: 'e@x',
    hazards: 'h', induction: 'i', gateCode: 'g', parking: 'pk', hours: 'hr',
    switchboard: 'sw', supply: 'su',
  })
  assert.deepEqual(out.site, { gateCode: 'g', parking: 'pk', hours: 'hr' })
  assert.deepEqual(out.contacts, [{ role: 'r', name: 'n', phone: 'p', email: 'e@x' }])
  assert.deepEqual(out.hazards, ['h'])
  assert.equal(out.inductionRequired, 'i')
  assert.equal(out.switchboardLocation, 'sw')
  assert.equal(out.supply, 'su')
})

test('the key it is read from is the one the Worker allows', () => {
  const READABLE = /^field:[A-Za-z0-9]{1,20}$|^fieldTasks:(commercial|residential)$|^planning:(staff-roster|field-jobs|job-details)$/
  assert.ok(READABLE.test(JOB_DETAILS_KEY))
})

test('nothing typed produces nothing at all, not a row of empty fields', () => {
  assert.deepEqual(toFieldJob(undefined), {})
  assert.deepEqual(toFieldJob({}), {})
  assert.deepEqual(toFieldJob({ contactName: '   ', hazards: '' }), {})
})

// The screen labels the row "<role> · <name>", so a blank role renders as a
// leading separator and reads as a rendering fault.
test('a contact with no role still gets one', () => {
  assert.equal(toFieldJob({ contactName: 'Dave', contactPhone: '027 555 0101' }).contacts[0].role, 'Site contact')
})

test('a contact with only an email is still a contact', () => {
  const out = toFieldJob({ contactEmail: 'dave@example.co.nz' })
  assert.equal(out.contacts.length, 1)
  assert.equal(out.contacts[0].phone, '')
})

test('the email key is absent rather than blank when nobody typed one', () => {
  assert.ok(!('email' in toFieldJob({ contactName: 'Dave', contactPhone: '1' }).contacts[0]))
})

test('hazards split on semicolons and new lines, one per row on site', () => {
  assert.deepEqual(splitHazards('Live switchboard; asbestos in ceiling'), ['Live switchboard', 'asbestos in ceiling'])
  assert.deepEqual(splitHazards('Live board\nOpen trench\n'), ['Live board', 'Open trench'])
  assert.deepEqual(splitHazards(';;  ;'), [])
})

// "Live switchboard, isolated Tuesday" is one hazard. Splitting it would show
// a crew the words "isolated Tuesday" with no subject.
test('a comma does not split a hazard', () => {
  assert.deepEqual(splitHazards('Live switchboard, isolated Tuesday'), ['Live switchboard, isolated Tuesday'])
})

const PUBLISHED = [
  {
    jobNumber: '7428',
    jobName: 'FAB Pegasus Lakeside',
    category: 'Residential New Build',
    type: 'residential',
    site: { address: '21A Lakeside Drive' },
    scope: 'Three units',
  },
]

test('the address and the description survive, because nothing here owns them', () => {
  const [job] = applyJobDetails(PUBLISHED, { 7428: { contactName: 'Fab Building Ltd' } })
  assert.equal(job.site.address, '21A Lakeside Drive')
  assert.equal(job.scope, 'Three units')
  assert.equal(job.category, 'Residential New Build')
  assert.equal(job.type, 'residential')
})

test('a typed gate code joins the published address rather than replacing it', () => {
  const [job] = applyJobDetails(PUBLISHED, { 7428: { gateCode: 'Keybox 4821' } })
  assert.deepEqual(job.site, { address: '21A Lakeside Drive', gateCode: 'Keybox 4821' })
})

// THE ONE THAT MATTERS. Entries published before the app read this blob still
// carry a contact baked into them. Without stripping it first, a number
// deleted in the dashboard would keep ringing on site for ever.
test('clearing a contact in the dashboard clears it on site', () => {
  const stale = [{ ...PUBLISHED[0], contacts: [{ role: 'Site contact', name: 'Old', phone: '999' }] }]
  const [job] = applyJobDetails(stale, {})
  assert.ok(!job.contacts)
})

test('a stale published hazard does not outlive the column it came from', () => {
  const stale = [{ ...PUBLISHED[0], hazards: ['Old hazard'], supply: '1 phase' }]
  const [job] = applyJobDetails(stale, {})
  assert.ok(!job.hazards)
  assert.ok(!job.supply)
})

test('a job with nothing typed against it still comes through', () => {
  const [job] = applyJobDetails(PUBLISHED, {})
  assert.equal(job.jobNumber, '7428')
  assert.equal(job.site.address, '21A Lakeside Drive')
})

// The details read is allowed to fail on a bad connection without taking the
// job list down with it.
test('no details at all is the job list unchanged', () => {
  assert.deepEqual(applyJobDetails(PUBLISHED, null)[0].jobNumber, '7428')
  assert.deepEqual(applyJobDetails(null, {}), [])
})

// The blob is keyed by job number as a string; the list carries it as one
// too, but a number that slipped through must still match.
test('a numeric job number still matches its details', () => {
  const [job] = applyJobDetails([{ jobNumber: 7428 }], { 7428: { contactName: 'Fab' } })
  assert.equal(job.contacts[0].name, 'Fab')
})
