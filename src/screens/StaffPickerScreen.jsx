import { initials } from '../lib/format'
import EmptyState, { SkeletonRows } from '../components/EmptyState'
import { Users } from 'lucide-react'

// Tapping a name IS the commit — no confirm step, no Continue button. It is
// the first thing anyone does each morning and it should cost one tap.
//
// A manager picks a name here too — the app records who changed what, and
// that is worth knowing whichever chair you are in — so the heading cannot
// be "Who's on site?" for both. It asked a manager sitting at a desk a
// question about a site they were not on.
export default function StaffPickerScreen({ staff, loading, role, onPick }) {
  const managing = role === 'manager'
  return (
    <div className="app-frame nav-fade">
      <div className="app-scroll mx-auto w-full max-w-md px-4">
      <div className="safe-top pt-10 pb-6">
        <h1 className="large-title">{managing ? 'Who are you?' : "Who's on site?"}</h1>
        <p className="mt-1 text-[14px] text-[color:var(--text-secondary)]">
          {managing
            ? 'Pick your name so your changes are recorded against it.'
            : "Pick your name to see today's jobs."}
        </p>
      </div>
      {loading ? (
        <SkeletonRows count={5} />
      ) : staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No crew on the roster yet"
          body="Add people in the dashboard and they'll appear here."
        />
      ) : (
        // Eighteen names as eighteen separate cards is eighteen shadows and
        // seventeen gaps — about a screen and a half of nothing to scroll
        // through before you reach the Ss. One grouped list is how a phone
        // shows a list of people, and it fits far more of them at once.
        <ul className="list-group">
          {staff.map((person) => (
            <li key={person.id}>
              <button onClick={() => onPick(person)} className="list-row">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--surface-2)] text-[14px] font-medium">
                  {initials(person.name)}
                </span>
                <span className="text-[17px]">{person.name}</span>
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
