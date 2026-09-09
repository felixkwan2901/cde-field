// Light by default and it does NOT follow the operating system.
//
// This is the one place the app deliberately disagrees with the dashboard.
// A dark UI in direct sun is unreadable — auto-brightness maxes out and the
// screen simply emits less light than the sky reflecting off the glass. An
// electrician's phone set to auto-dark at 5pm is not a statement about the
// roof they are standing on. Dark stays available as an explicit choice for
// ceiling spaces and night work.
const KEY = 'cdefield.theme'

export function readTheme() {
  try {
    const stored = localStorage.getItem(KEY)
    return stored === 'dark' || stored === 'light' ? stored : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Won't persist; the page is still themed correctly right now.
  }
  return theme
}
