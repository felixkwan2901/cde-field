// Rings are for roll-ups only — a day, a job. A single task gets a bar,
// because under about 48px a ring cannot carry a legible number in its
// centre, and at task level the number *is* the content.
//
// Three visually distinct states, because collapsing them is how a number
// starts lying. "No tasks yet" is not 0%: 0% is a claim about work, and this
// is the absence of a plan. Rendering it as 0% makes a job list read as
// "everyone is failing" on day one, and hides the jobs genuinely at zero.
export default function ProgressRing({ progress, size = 88, stroke = 8, className = '' }) {
  const { state, percent } = progress
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const filled = state === 'no-data' ? 0 : ((percent ?? 0) / 100) * circumference

  const trackColor = state === 'no-data' ? 'var(--border-strong)' : 'var(--border)'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={ariaLabel(progress)}
      className={className}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={stroke}
        // Dashed track for "nothing planned", so it reads as an outline
        // waiting to be filled rather than a measurement of zero.
        strokeDasharray={state === 'no-data' ? '3 6' : undefined}
        opacity={state === 'no-data' ? 0.5 : 1}
      />
      {state !== 'no-data' && state !== 'zero' && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          // Starts at twelve o'clock rather than three.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 400ms ease' }}
        />
      )}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-primary)"
        fontSize={size * 0.28}
        fontWeight="600"
      >
        {state === 'no-data' ? '—' : `${percent}%`}
      </text>
    </svg>
  )
}

function ariaLabel({ state, percent, started, total }) {
  if (state === 'no-data') return 'No tasks broken down for this job yet'
  if (state === 'zero') return `Not started, ${total} tasks`
  return `${percent} percent, ${started} of ${total} tasks started`
}
