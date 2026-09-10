import { ChevronRight, ClipboardList, HardHat } from 'lucide-react'
import Brand from '../components/Brand'

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
    <div className="app-frame nav-fade">
      {/* Centred in whatever height it is given, rather than pinned to the
          top of it. On a phone that is the same thing; on a laptop the old
          version left two thirds of the window empty below the content and
          read as a page that had failed to finish loading. */}
      <div className="app-scroll flex flex-col justify-center px-4 py-8">
        <div className="mx-auto w-full max-w-md">
          <header className="safe-top flex items-center gap-4 pb-8">
            <Brand size={56} />
            <div className="min-w-0">
              <p className="truncate text-md font-medium leading-tight">Cassidy-Davies</p>
              <p className="truncate text-sm text-ink-2">Electrical</p>
            </div>
          </header>

          <h1 className="large-title">Field</h1>
          <p className="mt-1 mb-6 text-sm text-ink-2">Which are you today?</p>

          <div className="flex flex-col gap-2">
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
              read. This is a view, not a permission. */}
          <p className="mt-6 text-xs leading-relaxed text-ink-2">
            Prototype. There&apos;s no sign-in — picking a role or a name identifies you
            to your workmates, it doesn&apos;t restrict anything.
          </p>
          <div className="safe-bottom" />
        </div>
      </div>
    </div>
  )
}

function RoleCard({ icon: Icon, title, body, onClick }) {
  return (
    <button onClick={onClick} className="card pressable flex items-center gap-4 p-4 text-left">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-2">
        <Icon size={24} className="text-accent" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-md font-medium">{title}</span>
        <span className="block text-xs text-ink-2">{body}</span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-ink-2" aria-hidden="true" />
    </button>
  )
}
