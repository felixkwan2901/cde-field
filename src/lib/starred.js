// The jobs you are working on.
//
// Nothing in the office records who is on which job on which day — the
// planning sheet tracks headcount by month, not people by site — so the only
// honest source for "which of these 28 is mine" is the person holding the
// phone. A star is them telling us.
//
// Deliberately NOT called "assigned". Nobody assigned it; you tapped it. The
// moment it reads as an instruction from the office, someone will wait to be
// given a job instead of starring the one they are standing on.
//
// Per staff id, not per device: a tablet left in a ute gets picked up by
// whoever is in it, and seeing yesterday's bloke's list is worse than seeing
// none. Same localStorage that already holds the identity, so it survives a
// reload, works with no signal, and costs no KV write on a tap.
const KEY = 'cdefield.starred'

// Every accessor is wrapped. localStorage throws outright in private mode on
// some browsers rather than failing quietly, and this runs on eighteen
// personal phones nobody has configured — identity.js takes the same care for
// the same reason.
function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : null
    // Anything that is not the shape we wrote is treated as nothing. A
    // half-written or hand-edited value should cost someone their stars, not
    // crash the screen they are standing in front of.
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Private mode, or the disk is full. The stars last for this session and
    // are gone next time — a nuisance, not a failure, and not worth taking
    // the screen down for.
  }
}

const list = (all, staffId) => {
  const v = all[String(staffId ?? '')]
  return Array.isArray(v) ? v.filter((n) => typeof n === 'string') : []
}

// The job numbers this person has starred, oldest first.
export function readStarred(staffId) {
  if (!staffId) return []
  return list(readAll(), staffId)
}

export function isStarred(staffId, jobNumber) {
  return readStarred(staffId).includes(String(jobNumber))
}

// Returns the new list, so a caller can put it straight into state rather
// than reading back and hoping the write landed.
export function toggleStarred(staffId, jobNumber) {
  if (!staffId) return []
  const all = readAll()
  const key = String(staffId)
  const job = String(jobNumber)
  const current = list(all, key)
  const next = current.includes(job) ? current.filter((n) => n !== job) : [...current, job]
  writeAll({ ...all, [key]: next })
  return next
}
