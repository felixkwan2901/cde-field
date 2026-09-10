import { ClipboardList, HardHat } from 'lucide-react'

// The landing screen. Two questions get asked on this app and they are not
// the same question: a sparky asks "what am I doing today", a manager asks
// "is everyone moving, and where is it stuck". Splitting here means neither
// has to wade through the other's screen.
export default function RoleScreen({ onPick }) {
  return (
    <div className="app-frame nav-fade">
      <div className="app-scroll mx-auto w-full max-w-md px-4">
      <div className="safe-top pt-12 pb-8">
        <h1 className="large-title">CDE Field</h1>
        <p className="mt-1 text-sm text-ink-2">
          Which are you today?
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => onPick('worker')}
          className="pressable flex items-center gap-4 rounded-lg border border-line p-4 text-left"
        >
          <HardHat size={26} className="shrink-0 text-accent" aria-hidden="true" />
          <span>
            <span className="block text-md font-medium">I&apos;m on site</span>
            <span className="block text-xs text-ink-2">
              See your jobs and record what you&apos;ve done
            </span>
          </span>
        </button>

        <button
          onClick={() => onPick('manager')}
          className="pressable flex items-center gap-4 rounded-lg border border-line p-4 text-left"
        >
          <ClipboardList size={26} className="shrink-0 text-accent" aria-hidden="true" />
          <span>
            <span className="block text-md font-medium">I&apos;m managing</span>
            <span className="block text-xs text-ink-2">
              Every job, who&apos;s on it, and what hasn&apos;t moved
            </span>
          </span>
        </button>
      </div>

      {/* Said plainly rather than buried in a README nobody on site will
          read. This is a view, not a permission. */}
      <p className="mt-6 rounded-sm bg-surface-2 px-4 py-4 text-xs leading-relaxed text-ink-2">
        Prototype. There&apos;s no sign-in — picking a role or a name identifies you to
        your workmates, it doesn&apos;t restrict anything.
      </p>
      <div className="safe-bottom h-8" />
      </div>
    </div>
  )
}
