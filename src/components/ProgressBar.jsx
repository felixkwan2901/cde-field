// The task-level equivalent of the ring. A thin bar, because at this size
// the percentage beside it is what gets read and the bar is only there to
// make the row scannable at a glance.
export default function ProgressBar({ pct, na = false }) {
  if (na) return <div className="h-1.5 w-full rounded-full bg-line opacity-60" />
  const width = typeof pct === 'number' ? Math.max(0, Math.min(100, pct)) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full bg-accent"
        style={{ width: `${width}%`, transition: 'width 300ms ease' }}
      />
    </div>
  )
}
