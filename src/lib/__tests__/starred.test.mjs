import test from 'node:test'
import assert from 'node:assert/strict'

// A localStorage that behaves like the real one, installed before the module
// under test is imported.
function installStorage({ throwOnGet = false, throwOnSet = false } = {}) {
  const store = new Map()
  globalThis.localStorage = {
    getItem(k) {
      if (throwOnGet) throw new DOMException('denied')
      return store.has(k) ? store.get(k) : null
    },
    setItem(k, v) {
      if (throwOnSet) throw new DOMException('quota')
      store.set(k, String(v))
    },
    removeItem(k) { store.delete(k) },
  }
  return store
}

const load = () => import(`../starred.js?t=${Math.random()}`)

test('a star survives being read back', async () => {
  installStorage()
  const { toggleStarred, readStarred, isStarred } = await load()
  toggleStarred('staff-1', '7658')
  assert.deepEqual(readStarred('staff-1'), ['7658'])
  assert.equal(isStarred('staff-1', '7658'), true)
})

test('tapping the same job again removes it', async () => {
  installStorage()
  const { toggleStarred, readStarred } = await load()
  toggleStarred('staff-1', '7658')
  assert.deepEqual(toggleStarred('staff-1', '7658'), [])
  assert.deepEqual(readStarred('staff-1'), [])
})

test('toggle returns the new list, so nothing has to read back', async () => {
  installStorage()
  const { toggleStarred } = await load()
  assert.deepEqual(toggleStarred('staff-1', '7658'), ['7658'])
  assert.deepEqual(toggleStarred('staff-1', '8142'), ['7658', '8142'])
})

// The reason this is keyed by staff at all: a tablet in a ute gets picked up
// by whoever is in it, and seeing yesterday's list is worse than seeing none.
test('two people on one device do not see each other\'s', async () => {
  installStorage()
  const { toggleStarred, readStarred } = await load()
  toggleStarred('staff-1', '7658')
  toggleStarred('staff-2', '8142')
  assert.deepEqual(readStarred('staff-1'), ['7658'])
  assert.deepEqual(readStarred('staff-2'), ['8142'])
})

test('job numbers are compared as strings either way round', async () => {
  installStorage()
  const { toggleStarred, isStarred } = await load()
  toggleStarred('staff-1', 7658)
  assert.equal(isStarred('staff-1', '7658'), true)
  assert.equal(isStarred('staff-1', 7658), true)
})

test('no staff picked yet is empty, not a crash', async () => {
  installStorage()
  const { readStarred, isStarred, toggleStarred } = await load()
  for (const id of [null, undefined, '']) {
    assert.deepEqual(readStarred(id), [])
    assert.equal(isStarred(id, '7658'), false)
    assert.deepEqual(toggleStarred(id, '7658'), [])
  }
})

// Private browsing throws outright on some browsers rather than failing
// quietly, and this runs on eighteen personal phones nobody has configured.
test('storage that throws costs the stars, not the screen', async () => {
  installStorage({ throwOnGet: true, throwOnSet: true })
  const { readStarred, toggleStarred, isStarred } = await load()
  assert.deepEqual(readStarred('staff-1'), [])
  assert.deepEqual(toggleStarred('staff-1', '7658'), ['7658'])
  assert.equal(isStarred('staff-1', '7658'), false)
})

test('a value from somewhere else is ignored rather than trusted', async () => {
  for (const junk of ['not json', '[]', '"a string"', 'null', '{"staff-1":"7658"}']) {
    const store = installStorage()
    store.set('cdefield.starred', junk)
    const { readStarred } = await load()
    assert.deepEqual(readStarred('staff-1'), [], `junk: ${junk}`)
  }
})

test('non-string entries are dropped rather than rendered', async () => {
  const store = installStorage()
  store.set('cdefield.starred', JSON.stringify({ 'staff-1': ['7658', 42, null, { a: 1 }] }))
  const { readStarred } = await load()
  assert.deepEqual(readStarred('staff-1'), ['7658'])
})
