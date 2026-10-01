import { LogOut, HardHat, ClipboardList, Info, LayoutDashboard, ExternalLink } from 'lucide-react'
import InstallPrompt from '../components/InstallPrompt'
import TeamAvatar from '../components/TeamAvatar'
import { teamMember } from '../lib/teamPhotos'

// Where the office dashboard lives. The two apps are separate builds on
// separate URLs, so getting back is a real link rather than a route — and
// until now there wasn't one, which left anyone who opened this app from a
// QR code or a home-screen icon with no way across.
//
// Build-time switch for the same reason workerClient uses one: the dashboard
// is mid-move to a login-gated copy, and a build that forgets the variable
// should land on the address that works today rather than nowhere.
const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL ?? 'https://www.kwanfelix.me/excel-dashboard/'

// Every app has this tab, and it exists for a reason that is not tidiness:
// it is where the things that used to clutter the header go — the avatar
// that switches who you are, and the account/office links below. The theme
// toggle moved back OUT of here and into the top bar (see App.jsx): it is
// used mid-job, in a ceiling space or in the sun, and a control reached for
// in that moment cannot cost a trip to a tab whose whole point is settings
// visited rarely.
export default function MeScreen({ staff, role, isAdmin, onSwitchStaff, onSwitchRole }) {
  return (
    <>
      <div className="card mb-6 flex items-center gap-2 p-4">
        <TeamAvatar name={staff.name} size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-md font-medium">{staff.name}</p>
          <p className="text-xs text-ink-2">
            {[teamMember(staff.name)?.role, role === 'manager' ? 'Managing' : 'On site'].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <InstallPrompt />

      <p className="list-label">Office</p>
      <div className="list-group mb-6">
        {/* New tab, deliberately. This app holds unsent taps in an outbox, and
            replacing the page is the one way to walk away from them. */}
        <a
          href={DASHBOARD_URL}
          target="_blank"
          rel="noreferrer"
          className="list-row text-ink no-underline"
        >
          <LayoutDashboard size={20} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Open the dashboard</span>
            <span className="block text-xs text-ink-2">
              Weekly claims, job costs and the checklists
            </span>
          </span>
          <ExternalLink size={16} aria-hidden="true" className="shrink-0 text-ink-2" />
        </a>
      </div>

      <p className="list-label">Settings</p>
      <div className="list-group mb-6">
        {/* Switching TO managing is hidden entirely for someone not on the
            admin list, rather than shown and left to bounce them back — a
            visible control that doesn't work is worse than no control.
            Switching back to on-site is always available; that direction
            needs no gate. */}
        {(role === 'manager' || isAdmin) && (
          <button className="list-row" onClick={onSwitchRole}>
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
        )}

        <button className="list-row" onClick={onSwitchStaff}>
          <LogOut size={20} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Not you? Switch name</span>
            <span className="block text-xs text-ink-2">
              Changes who updates are recorded against
            </span>
          </span>
        </button>
      </div>

      <p className="list-label">About</p>
      <div className="list-group">
        <div className="list-row">
          <Info size={20} aria-hidden="true" className="text-ink-2" />
          <span className="min-w-0 flex-1 text-xs leading-relaxed text-ink-2">
            Prototype. The jobs, addresses and staff list are real and shared; photos
            stay on this phone for now. There is no sign-in — picking a name says who you
            are. Managing is limited to people the office has set up for it; everything
            else is unrestricted.
          </span>
        </div>
      </div>
    </>
  )
}
