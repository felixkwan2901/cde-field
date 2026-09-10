import { Moon, Sun, LogOut, HardHat, ClipboardList, Info } from 'lucide-react'
import InstallPrompt from '../components/InstallPrompt'
import { initials } from '../lib/format'

// Every app has this tab, and it exists for a reason that is not tidiness:
// it is where the things that used to clutter the header go. The theme
// toggle, the avatar that switches who you are, and the sync badge were
// three controls competing with the title for a 390px bar. Two of them are
// touched once a week. Moving them here gives the bar back to the one
// thing it should carry, and gives these controls room to be labelled
// rather than guessed at from an icon.
export default function MeScreen({ staff, role, theme, onToggleTheme, onSwitchStaff, onSwitchRole }) {
  return (
    <>
      <div className="mb-6 flex items-center gap-4 border-b border-line pb-6">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-2 text-md font-medium">
          {initials(staff.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-md font-medium">{staff.name}</p>
          <p className="text-xs text-ink-2">
            {role === 'manager' ? 'Managing' : 'On site'}
          </p>
        </div>
      </div>

      <InstallPrompt />

      <p className="rows-label !pt-0">Settings</p>
      <div className="rows mb-6">
        <button className="row items-center" onClick={onToggleTheme}>
          {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
            <span className="block text-xs text-ink-2">
              {theme === 'dark'
                ? 'Easier to read outdoors'
                : 'Easier on the eyes in a ceiling space'}
            </span>
          </span>
        </button>

        <button className="row items-center" onClick={onSwitchRole}>
          {role === 'manager' ? (
            <HardHat size={20} aria-hidden="true" />
          ) : (
            <ClipboardList size={20} aria-hidden="true" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">
              Switch to {role === 'manager' ? 'on site' : 'managing'}
            </span>
            <span className="block text-xs text-ink-2">
              {role === 'manager' ? 'Your own jobs and tasks' : 'Every job and who is on it'}
            </span>
          </span>
        </button>

        <button className="row items-center" onClick={onSwitchStaff}>
          <LogOut size={20} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Not you? Switch name</span>
            <span className="block text-xs text-ink-2">
              Changes who updates are recorded against
            </span>
          </span>
        </button>
      </div>

      <p className="rows-label">About</p>
      <div className="rows">
        <div className="row">
          <Info size={20} aria-hidden="true" className="text-ink-2" />
          <span className="min-w-0 flex-1 text-xs leading-relaxed text-ink-2">
            Prototype. Progress you record and the staff list are real and shared; the jobs,
            addresses and task lists are demonstration data, and photos stay on this phone.
            There is no sign-in — picking a name says who you are, it does not restrict
            anything.
          </span>
        </div>
      </div>
    </>
  )
}
