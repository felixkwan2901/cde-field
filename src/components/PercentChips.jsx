const OPTIONS = [0, 25, 50, 75, 100]

// The primary control, and the thing this app lives or dies on.
//
// Chose chips over the alternatives on the actual conditions — gloves, sun,
// one hand, wanting it done in two seconds:
//
//   Slider    needs a drag. A gloved finger's contact patch wanders, a
//             horizontal drag inside a vertical scroll list loses its first
//             few pixels to gesture disambiguation, and your thumb covers
//             the number you are reading. It also invents precision: a 63%
//             nobody meant.
//   Stepper   0 to 60% is six taps. Fine for nudging, fails the two-second
//             test for a first entry.
//   Segments  best idea of the lot — the thing you read is the thing you
//             touch — but ten segments across a phone is 34px each, below
//             the bare-finger minimum let alone the gloved one.
//
// The real argument isn't ergonomics though, it's honesty: nobody's estimate
// of a rough-in is 63%. Quantising to quarters makes the number more
// truthful, and makes two electricians' estimates comparable.
//
// Position-stable is the other half. The 75 chip is in the same place on
// every task on every job, so after a week it can be hit without reading —
// which is the real answer to "poor light".
export default function PercentChips({ value, onChange, disabled = false }) {
  return (
    <div
      role="radiogroup"
      aria-label="Percent complete"
      // 3 + 2 below 360px rather than five shrunken chips. Reflow, never
      // shrink: shrinking sacrifices the exact property the control was
      // chosen for.
      className="grid grid-cols-3 gap-2 min-[360px]:grid-cols-5"
    >
      {OPTIONS.map((option, i) => {
        const selected = value === option
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option)}
            // The last chip spans the empty column in the 3+2 layout so the
            // row doesn't end ragged.
            className={`tap pressable flex h-16 items-center justify-center rounded-sm text-lg font-medium disabled:opacity-40 ${
              i === 4 ? 'col-span-1 max-[359px]:col-span-3' : ''
            } ${
              // Selected is a solid fill, not an outline: a filled block is
              // the only thing that reliably survives a sun-washed screen,
              // and it is legible in greyscale, which an accent border is
              // not.
              selected
                ? 'bg-accent text-accent-ink'
                : 'border border-line-strong bg-surface text-ink'
            }`}
          >
            {option}
            {/* ml-0.5 is optical, not layout: 2px between a figure and its unit. */}
            {selected && <span className="ml-0.5 text-xs">%</span>}
          </button>
        )
      })}
    </div>
  )
}
