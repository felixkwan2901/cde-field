// Which task areas someone has folded away, remembered per job.
//
// The original rule here was that areas are plain labels and never fold,
// because folding hides work and that is the wrong DEFAULT on a job screen.
// That reasoning survives: an area still arrives open, and folding one is
// something a person chooses. What changes is that a fifteen-task job across
// five areas is a lot of scrolling when you are working in one of them, and
// being unable to put the other four away is its own kind of unusable.
//
// The rule that keeps the original concern honest lives in the screen, not
// here: a folded area still reports how many tasks it holds and how many are
// done, so folding hides the rows and never the work.
//
// Per job, because which areas matter depends on which job you are standing
// in, and losing it on every navigation would make the whole thing pointless.
const KEY = 'cdefield.collapsedAreas'

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    // Private windows and cleared site data both land here. A job screen
    // that throws because a preference could not be read would be a much
    // worse bug than one that opens with everything expanded.
    return {}
  }
}

export function readCollapsed(jobNumber) {
  const areas = readAll()[String(jobNumber)]
  return new Set(Array.isArray(areas) ? areas : [])
}

export function writeCollapsed(jobNumber, areas) {
  try {
    const all = readAll()
    const list = [...areas]
    if (list.length) all[String(jobNumber)] = list
    else delete all[String(jobNumber)]
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Nothing useful to do: the fold still works for this session, it just
    // will not survive a reload.
  }
}
