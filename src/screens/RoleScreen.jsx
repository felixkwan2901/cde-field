import { ClipboardList, HardHat } from 'lucide-react'

// The landing screen. Two questions get asked on this app and they are not
// the same question: a sparky asks "what am I doing today", a manager asks
// "is everyone moving, and where is it stuck". Splitting here means neither
// has to wade through the other's screen.
export default function RoleScreen({ onPick }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4">
      <div className="safe-top pt-12 pb-8">
        <h1 className="text-[26px] font-semibold">CDE Field</h1>
        <p className="mt-1 text-[15px] text-[color:var(--text-secondary)]">
          Which are you today?
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => onPick('worker')}
          className="flex items-center gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5 text-left"
        >
          <HardHat size={26} className="shrink-0 text-[color:var(--brand-green)]" aria-hidden="true" />
          <span>
            <span className="block text-[18px] font-medium">I&apos;m on site</span>
            <span className="block text-[14px] text-[color:var(--text-secondary)]">
              See your jobs and record what you&apos;ve done
            </span>
          </span>
        </button>

        <button
          onClick={() => onPick('manager')}
          className="flex items-center gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5 text-left"
        >
          <ClipboardList size={26} className="shrink-0 text-[color:var(--brand-orange)]" aria-hidden="true" />
          <span>
            <span className="block text-[18px] font-medium">I&apos;m managing</span>
            <span className="block text-[14px] text-[color:var(--text-secondary)]">
              Every job, who&apos;s on it, and what hasn&apos;t moved
            </span>
          </span>
        </button>
      </div>

      {/* Said plainly rather than buried in a README nobody on site will
          read. This is a view, not a permission. */}
      <p className="mt-6 rounded-xl bg-[color:var(--surface-2)] px-4 py-3 text-[12px] leading-relaxed text-[color:var(--text-muted)]">
        Prototype. There&apos;s no sign-in — picking a role or a name identifies you to
        your workmates, it doesn&apos;t restrict anything.
      </p>
    </div>
  )
}
