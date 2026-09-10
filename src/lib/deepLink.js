// A job number in the URL, so a QR code on a switchboard door opens that
// job's task list directly: ?job=9412
//
// Read once at module load and then forgotten, because urlState-style
// rewriting is not worth it here — the link's whole job is the first screen
// after a scan. Kept in sessionStorage in between so it survives the staff
// picker: someone scanning a code on their first ever use has to say who
// they are first, and losing their destination to that would make the code
// feel broken.
const KEY = 'cdefield.pendingJob'

export function readDeepLinkJob() {
  let requested = null
  try {
    requested = new URL(window.location.href).searchParams.get('job')
  } catch {
    // Malformed URL; fall through to whatever was pending.
  }
  // Same shape the Worker's key allowlist accepts, so a junk parameter can
  // never become a key.
  if (requested && !/^[A-Za-z0-9]{1,20}$/.test(requested)) requested = null

  try {
    if (requested) {
      sessionStorage.setItem(KEY, requested)
      return requested
    }
    return sessionStorage.getItem(KEY)
  } catch {
    return requested
  }
}

export function clearDeepLinkJob() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Nothing to do; at worst the same job opens again this session.
  }
  // Take it out of the address bar too, so a refresh or a share doesn't
  // silently reopen a job someone has since navigated away from.
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.has('job')) {
      url.searchParams.delete('job')
      window.history.replaceState({}, '', url)
    }
  } catch {
    // Cosmetic only.
  }
}
