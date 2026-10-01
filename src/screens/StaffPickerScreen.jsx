import EmptyState, { SkeletonRows } from '../components/EmptyState'
import PickerShell from '../components/PickerShell'
import { Users } from 'lucide-react'
import TeamAvatar from '../components/TeamAvatar'

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
    <PickerShell pitch={managing ? 'Every job, who is on it, and what has not moved.' : "See your jobs, record what's done, and let the office see it the moment you tap."}>
      <div className="pb-5">
        <h1 className="large-title">{managing ? 'Who are you?' : "Who's on site?"}</h1>
        <p className="mt-1 text-sm text-ink-2">
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
        // on one screen. The initials chip went for repeating the letter
        // beside it; a photo is different — it is the same face the
        // dashboard shows, and finding yourself by face is quicker than
        // reading four names that start with J.
        <ul className="name-grid">
          {visible.map((person) => (
            <li key={person.id}>
              <button onClick={() => onPick(person)} className="name-tile">
                <TeamAvatar name={person.name} size={36} className="name-tile__face" />
                {/* Two lines, not one truncated one: with a face in the
                    tile a surname no longer fits beside it on a phone, and
                    "Andy Sc…" is worse than no surname at all. */}
                <span className="name-tile__name">
                  <span className="truncate">{person.name.split(/\s+/)[0]}</span>
                  <span className="name-tile__rest truncate">{person.name.split(/\s+/).slice(1).join(' ')}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </PickerShell>
  )
}
