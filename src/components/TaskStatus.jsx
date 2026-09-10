import { taskState } from '../lib/taskState'

// A task's state as a colour and a word, not a colour alone.
//
// The list is the screen someone scans on a ladder, and scanning a column of
// percentages means reading every one. A filled dot is read peripherally, so
// "which of these is finished" becomes a glance rather than a pass. The word
// is there because colour alone fails for the roughly one man in twelve with
// a colour vision deficiency, and because it survives a washed-out screen.
const TONE = {
  done: { dot: 'var(--accent)', label: 'Done' },
  doing: { dot: 'var(--status-warning)', label: 'In progress' },
  todo: { dot: 'var(--border-strong)', label: 'Not started' },
  na: { dot: 'transparent', label: 'N/A' },
}

export default function TaskStatus({ task, showLabel = false }) {
  const state = taskState(task)
  const tone = TONE[state]
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{
          background: tone.dot,
          boxShadow: state === 'na' ? 'inset 0 0 0 2px var(--border-strong)' : undefined,
        }}
      />
      {showLabel && (
        <span className="text-xs text-ink-2">{tone.label}</span>
      )}
    </span>
  )
}
