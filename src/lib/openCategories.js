// Which kinds of work someone has opened on the Today list.
//
// Twenty-eight jobs in one column is a scroll, and the thing you are looking
// for is nearly always "the residential new builds" or "the commercial
// fit-outs" rather than a name you can already picture. So the list arrives
// as kinds of work, and you open the one you want.
//
// Everything starts closed. A closed section still shows how many jobs are in
// it, so folding hides the rows and never the fact that they exist — the same
// rule collapsed.js follows for task areas.
//
// Remembered, and per person, for the same reason the stars are: opening a
// job and coming back to find everything shut again would make it quicker to
// scroll than to use.
const KEY = 'cdefield.openCategories'

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Private mode. The sections stay open for this session and start closed
    // next time, which is a nuisance rather than a failure.
  }
}

const list = (all, staffId) => {
  const v = all[String(staffId ?? '')]
  return Array.isArray(v) ? v.filter((c) => typeof c === 'string') : []
}

export function readOpenCategories(staffId) {
  if (!staffId) return []
  return list(readAll(), staffId)
}

// Returns the new list, so the caller can set state from it directly.
export function toggleCategory(staffId, category) {
  if (!staffId) return []
  const all = readAll()
  const key = String(staffId)
  const name = String(category)
  const current = list(all, key)
  const next = current.includes(name) ? current.filter((c) => c !== name) : [...current, name]
  writeAll({ ...all, [key]: next })
  return next
}
