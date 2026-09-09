import { initials } from '../lib/format'
import EmptyState, { SkeletonRows } from '../components/EmptyState'
import { Users } from 'lucide-react'

// Tapping a name IS the commit — no confirm step, no Continue button. It is
// the first thing anyone does each morning and it should cost one tap.
export default function StaffPickerScreen({ staff, loading, onPick }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4">
      <div className="safe-top pt-10 pb-6">
        <h1 className="text-[26px] font-semibold">Who&apos;s on site?</h1>
        <p className="mt-1 text-[14px] text-[color:var(--text-secondary)]">
          Pick your name to see today&apos;s jobs.
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
        <ul className="flex flex-col gap-2 pb-10">
          {staff.map((person) => (
            <li key={person.id}>
              <button
                onClick={() => onPick(person)}
                className="tap flex w-full items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-4 py-4 text-left"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--surface-2)] text-[15px] font-medium">
                  {initials(person.name)}
                </span>
                <span className="text-[17px]">{person.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
