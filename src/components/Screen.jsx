import { ChevronLeft, Moon, Sun } from 'lucide-react'
import { initials } from '../lib/format'

// The frame every screen sits in: a sticky header that owns the notch, a
// scrolling body, and bottom padding that clears the home indicator.
export default function Screen({ title, subtitle, onBack, staff, onSwitchStaff, theme, onToggleTheme, children }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header className="safe-top sticky top-0 z-20 border-b border-[color:var(--border)] bg-[color:var(--surface-1)]">
        <div className="flex items-center gap-2 px-3 py-2">
          {onBack ? (
            <button onClick={onBack} aria-label="Back" className="tap -ml-2 flex items-center justify-center rounded-xl">
              <ChevronLeft size={26} />
            </button>
          ) : (
            <span className="w-2" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-semibold leading-tight">{title}</h1>
            {subtitle && (
              <p className="truncate text-[13px] text-[color:var(--text-secondary)]">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            className="tap flex items-center justify-center rounded-xl text-[color:var(--text-secondary)]"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {staff && (
            <button
              onClick={onSwitchStaff}
              aria-label={`Signed in as ${staff.name}. Change.`}
              className="tap flex items-center justify-center"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--surface-2)] text-[13px] font-medium">
                {initials(staff.name)}
              </span>
            </button>
          )}
        </div>
      </header>
      <main className="safe-bottom flex-1 px-4 pb-10 pt-4">{children}</main>
    </div>
  )
}
