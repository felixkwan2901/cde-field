import EmptyState, { SkeletonRows } from '../components/EmptyState'
import { Users } from 'lucide-react'

// Tapping a name IS the commit — no confirm step, no Continue button. It is
// the first thing anyone does each morning and it should cost one tap.
//
// A manager picks a name here too — the app records who changed what, and
// that is worth knowing whichever chair you are in — so the heading cannot
// be "Who's on site?" for both. It asked a manager sitting at a desk a
// question about a site they were not on.
export default function StaffPickerScreen({ staff, loading, role, admins, onPick }) {
  const managing = role === 'manager'
  // Only the names on the admin list, when picking "managing" — scrolling
  // past seventeen names that would just bounce back with an explanation is
  // friction the person picking "on site" has already had, and there is no
  // reason to make it happen twice. The gate in App.jsx's pickStaff stays as
  // the real enforcement; this is what makes the common case not need it.
  const visible = managing ? staff.filter((p) => admins?.has(String(p.id))) : staff
  return (
    <div className="app-frame nav-fade">
      <div className="app-scroll mx-auto w-full max-w-md px-4">
      <div className="safe-top pt-8 pb-6">
        <h1 className="large-title">{managing ? 'Who are you?' : "Who's on site?"}</h1>
        <p className="mt-1 text-xs text-ink-2">
          {managing
            ? 'Pick your name so your changes are recorded against it.'
            : "Pick your name to see today's jobs."}
        </p>
      </div>
      {loading ? (
        <SkeletonRows count={5} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title={managing ? 'No admins set up yet' : 'No crew on the roster yet'}
          body={
            managing
              ? 'Add a staff id to planning:field-admins in the dashboard.'
              : "Add people in the dashboard and they'll appear here."
          }
        />
      ) : (
        // Short names in full-width rows waste two thirds of every row on
        // whitespace and pay for it in scroll. Two columns fits all eighteen
        // on one screen. The initials chip is gone with them: fifteen of the
        // eighteen are single names, so it only repeated the letter sitting
        // beside it — and four consecutive "J" circles slowed the scan down
        // rather than speeding it up.
        <ul className="name-grid">
          {visible.map((person) => (
            <li key={person.id}>
              <button onClick={() => onPick(person)} className="name-tile">
                {person.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="safe-bottom h-4" />
      </div>
    </div>
  )
}
