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

// The phone paints the status bar and the Android nav bar from this, and it
// is the last thing that gives an installed PWA away: a white app under a
// slate status bar looks like a page inside a browser someone forgot to
// theme. It has to move with the theme, so it is set here rather than left
// as a fixed value in index.html.
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  // Read back rather than keep a second copy: the browser wants a literal
  // colour here, and a hardcoded one would silently drift the day
  // --surface-1 changes in index.css.
  const bar = getComputedStyle(document.documentElement).getPropertyValue('--surface-1').trim()
  if (bar) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bar)
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Won't persist; the page is still themed correctly right now.
  }
  return theme
}
