import { useEffect } from 'react'

// Tapping a chip commits immediately — no Save button, because a second tap
// that can be forgotten while you walk away is a data-loss bug with extra
// steps. The trade is that a mis-tap is now a write, and this is what makes
// that trade safe: five seconds, one full-size target, and it is the
// difference between tap-to-commit feeling confident and reckless.
export default function UndoToast({ message, onUndo, onExpire }) {
  useEffect(() => {
    const timer = setTimeout(onExpire, 5000)
    return () => clearTimeout(timer)
  }, [onExpire])

  return (
    <div className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-2 rounded-2xl bg-ink px-4 py-4 text-sm text-page shadow-[var(--shadow-card)]">
        <span className="min-w-0 truncate">{message}</span>
        <button onClick={onUndo} className="tap shrink-0 px-2 font-medium text-accent">
          Undo
        </button>
      </div>
    </div>
  )
}
