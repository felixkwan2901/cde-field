// The bar that carries progress everywhere now that rings have gone from
// the lists. Three states, same three the ring had: a dashed track means
// no task list exists yet and is not the same claim as an empty one, an
// empty track means nothing has started, a filled track means work.
export default function ProgressBar({ pct, na = false }) {
  if (na) return <div className="h-1.5 w-full rounded-full bg-line opacity-60" />

  if (typeof pct !== 'number') {
    return (
      <div
        className="h-1.5 w-full rounded-full"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, var(--border) 0 6px, transparent 6px 12px)',
        }}
      />
    )
  }

  const width = Math.max(0, Math.min(100, pct))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full bg-accent"
        style={{ width: `${width}%`, transition: 'width var(--motion) ease' }}
      />
    </div>
  )
}
