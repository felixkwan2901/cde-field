export default function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      {Icon && <Icon size={28} className="text-[color:var(--text-muted)]" aria-hidden="true" />}
      <p className="text-[16px] font-medium">{title}</p>
      {body && <p className="text-[14px] text-[color:var(--text-secondary)]">{body}</p>}
    </div>
  )
}

// Three skeleton rows rather than a spinner: a spinner tells you nothing
// about how long, or about what is coming.
export function SkeletonRows({ count = 3 }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-[76px] animate-pulse rounded-[var(--radius-card)] bg-[color:var(--surface-2)]" />
      ))}
    </div>
  )
}
