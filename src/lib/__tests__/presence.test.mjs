import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isOnSite, presence } from '../presence.js'

const at = (h, m = 0) => new Date(Date.UTC(2026, 8, 15, h, m)).toISOString()
const visit = (by, action, hour, min = 0) => ({ by, action, at: at(hour, min) })

test('nobody has ever been to a job with no visits', () => {
  const p = presence(undefined)
  assert.equal(p.everVisited, false)
  assert.equal(p.last, null)
  assert.deepEqual(p.onSite, [])
})

test('an arrival with no matching departure means someone is there', () => {
  const p = presence([visit('Andy', 'arrived', 7)])
  assert.deepEqual(p.onSite.map((v) => v.by), ['Andy'])
})

test('leaving clears you off site but keeps the visit on record', () => {
  const p = presence([visit('Andy', 'arrived', 7), visit('Andy', 'left', 15)])
  assert.deepEqual(p.onSite, [])
  assert.equal(p.everVisited, true, 'the job was visited even though nobody is there now')
  assert.equal(p.last.by, 'Andy')
})

test('coming back after leaving puts you on site again', () => {
  const p = presence([
    visit('Andy', 'arrived', 7),
    visit('Andy', 'left', 11),
    visit('Andy', 'arrived', 13),
  ])
  assert.deepEqual(p.onSite.map((v) => v.by), ['Andy'])
})

test('two arrivals without a departure is one person, not two', () => {
  const p = presence([visit('Andy', 'arrived', 7), visit('Andy', 'arrived', 8)])
  assert.equal(p.onSite.length, 1)
  assert.equal(p.onSite[0].at, at(8), 'the later arrival is the one that stands')
})

test('several people on one site are all listed, newest arrival first', () => {
  const p = presence([
    visit('Andy', 'arrived', 7),
    visit('Jake', 'arrived', 9),
    visit('Doug', 'arrived', 8),
  ])
  assert.deepEqual(p.onSite.map((v) => v.by), ['Jake', 'Doug', 'Andy'])
})

test('one person leaving does not take their workmates off site', () => {
  const p = presence([
    visit('Andy', 'arrived', 7),
    visit('Jake', 'arrived', 7, 30),
    visit('Andy', 'left', 12),
  ])
  assert.deepEqual(p.onSite.map((v) => v.by), ['Jake'])
})

// Ops replay out of order from the offline queue, so the module must sort
// rather than trust the array it is handed.
test('visits that arrive out of order are still read in time order', () => {
  const p = presence([visit('Andy', 'left', 15), visit('Andy', 'arrived', 7)])
  assert.deepEqual(p.onSite, [], 'the 15:00 departure is the last word, whatever order it landed in')
})

test('malformed entries are ignored rather than crashing a site screen', () => {
  const p = presence([null, { by: 'Andy' }, { at: at(7) }, visit('Jake', 'arrived', 7)])
  assert.deepEqual(p.onSite.map((v) => v.by), ['Jake'])
})

test('isOnSite answers for one person, not for the site', () => {
  const visits = [visit('Andy', 'arrived', 7), visit('Jake', 'arrived', 8), visit('Jake', 'left', 9)]
  assert.equal(isOnSite(visits, 'Andy'), true)
  assert.equal(isOnSite(visits, 'Jake'), false)
  assert.equal(isOnSite(visits, 'Doug'), false)
})

// The rule from the top of presence.js, kept honest by a test: this module
// must not grow a duration. A total is a timesheet, and hours belong to the
// workbook.
test('presence exposes no duration anywhere', () => {
  const p = presence([visit('Andy', 'arrived', 7), visit('Andy', 'left', 15)])
  const keys = [...Object.keys(p), ...Object.keys(p.last)]
  for (const k of keys) {
    assert.ok(
      !/duration|elapsed|hours|minutes|total/i.test(k),
      `presence must not report time worked — found "${k}"`,
    )
  }
})
