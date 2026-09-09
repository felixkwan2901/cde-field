// Who is using this phone. Attribution, not authentication — see the README.
//
// Prefixed because this app and the dashboard are served from the same
// origin and therefore share localStorage. Without the prefix a key here
// could quietly collide with one there.
const KEY = 'cdefield.staff'

export function readStaff() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeStaff(staff) {
  try {
    if (staff) localStorage.setItem(KEY, JSON.stringify(staff))
    else localStorage.removeItem(KEY)
  } catch {
    // Private browsing. They stay signed in for this session and get asked
    // again next time, which is a nuisance rather than a failure.
  }
  return staff
}
