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

// Role is stored beside the name, not derived from it: there is no role data
// anywhere in this system, and inventing one from a job title would be a
// guess. Worth being blunt about what this is — with no authentication,
// picking "managing" is choosing a VIEW, not being granted a permission.
// Anyone can pick it and anyone can still post progress as anyone. The fix
// for that is Cloudflare Access in front of the Worker, not a role picker.
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
