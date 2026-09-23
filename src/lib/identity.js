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

// Role is stored beside the name, not derived from it: nothing else in the
// system says who someone is. Worth being blunt about what this still is
// with no authentication: "managing" is checked against planning:field-admins
// (see listFieldAdmins in dataSource.js), which decides which SCREENS render
// — it does not decide what a phone can read or write. Anyone can still post
// progress as anyone, and anyone with the URL can read the same data a
// manager sees, admin list or not. The fix for that is Cloudflare Access in
// front of the Worker, not a role picker.
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
