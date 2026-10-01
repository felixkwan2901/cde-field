import { ChevronRight, ClipboardList, HardHat } from 'lucide-react'
import PickerShell from '../components/PickerShell'

// The landing screen. Two questions get asked on this app and they are not
// the same question: a sparky asks "what am I doing today", a manager asks
// "is everyone moving, and where is it stuck". Splitting here means neither
// has to wade through the other's screen.
//
// It is also the only screen anyone sees before they have chosen anything,
// so it is where the app says whose it is. Everything past this point is a
// working screen and gets its width back.
export default function RoleScreen({ onPick }) {
  return (
    <PickerShell pitch="See your jobs, record what's done, and let the office see it the moment you tap.">
      <h1 className="large-title">Which are you today?</h1>
      <p className="mt-1 mb-5 text-sm text-ink-2">Pick one — you can switch later from Me.</p>

      <div className="flex flex-col gap-3">
        <RoleCard
          icon={HardHat}
          title="I'm on site"
          body="See your jobs and record what you've done"
          onClick={() => onPick('worker')}
        />
        <RoleCard
          icon={ClipboardList}
          title="I'm managing"
          body="Every job, who's on it, and what hasn't moved"
          onClick={() => onPick('manager')}
        />
      </div>

      {/* Said plainly rather than buried in a README nobody on site will
          read. Picking "on site" really is unrestricted. "Managing" is
          checked against a short list the office keeps — not real
          authentication (nothing here is), just enough that tapping the
          wrong card doesn't quietly work. */}
      <p className="mt-6 text-xs leading-relaxed text-ink-2">
        There&apos;s no password. Picking a name identifies you to your workmates.
        Managing is limited to people the office has set up for it.
      </p>
    </PickerShell>
  )
}

function RoleCard({ icon: Icon, title, body, onClick }) {
  return (
    <button onClick={onClick} className="card pressable role-card flex items-center gap-4 p-5 text-left">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-2">
        <Icon size={24} className="text-accent" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-medium leading-tight">{title}</span>
        <span className="mt-1 block text-sm text-ink-2">{body}</span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-ink-2" aria-hidden="true" />
    </button>
  )
}
