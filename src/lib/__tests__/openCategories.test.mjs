import test from 'node:test'
import assert from 'node:assert/strict'

function installStorage({ throws = false } = {}) {
  const store = new Map()
  globalThis.localStorage = {
    getItem(k) { if (throws) throw new DOMException('denied'); return store.has(k) ? store.get(k) : null },
    setItem(k, v) { if (throws) throw new DOMException('quota'); store.set(k, String(v)) },
    removeItem(k) { store.delete(k) },
  }
  return store
}

const load = () => import(`../openCategories.js?t=${Math.random()}`)

test('everything starts closed', async () => {
  installStorage()
  const { readOpenCategories } = await load()
  assert.deepEqual(readOpenCategories('staff-1'), [])
})

test('opening one remembers it', async () => {
  installStorage()
  const { toggleCategory, readOpenCategories } = await load()
  toggleCategory('staff-1', 'Commercial New Build')
  assert.deepEqual(readOpenCategories('staff-1'), ['Commercial New Build'])
})

test('tapping it again closes it', async () => {
  installStorage()
  const { toggleCategory } = await load()
  toggleCategory('staff-1', 'Solar')
  assert.deepEqual(toggleCategory('staff-1', 'Solar'), [])
})

test('two people on one device keep their own', async () => {
  installStorage()
  const { toggleCategory, readOpenCategories } = await load()
  toggleCategory('staff-1', 'Commercial New Build')
  toggleCategory('staff-2', 'Residential Service')
  assert.deepEqual(readOpenCategories('staff-1'), ['Commercial New Build'])
  assert.deepEqual(readOpenCategories('staff-2'), ['Residential Service'])
})

test('category names with spaces and punctuation survive a round trip', async () => {
  installStorage()
  const { toggleCategory, readOpenCategories } = await load()
  toggleCategory('staff-1', 'Residential New Build')
  toggleCategory('staff-1', 'E4M')
  assert.deepEqual(readOpenCategories('staff-1'), ['Residential New Build', 'E4M'])
})

test('storage that throws costs the fold state, not the screen', async () => {
  installStorage({ throws: true })
  const { readOpenCategories, toggleCategory } = await load()
  assert.deepEqual(readOpenCategories('staff-1'), [])
  assert.deepEqual(toggleCategory('staff-1', 'Solar'), ['Solar'])
})

test('junk in storage is ignored rather than rendered', async () => {
  for (const junk of ['not json', '[]', 'null', '{"staff-1":"Solar"}']) {
    const store = installStorage()
    store.set('cdefield.openCategories', junk)
    const { readOpenCategories } = await load()
    assert.deepEqual(readOpenCategories('staff-1'), [], `junk: ${junk}`)
  }
})

test('no staff picked is empty, not a crash', async () => {
  installStorage()
  const { readOpenCategories, toggleCategory } = await load()
  assert.deepEqual(readOpenCategories(null), [])
  assert.deepEqual(toggleCategory(undefined, 'Solar'), [])
})
