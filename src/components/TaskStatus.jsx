import { taskState } from '../lib/taskState'

// A task's state as a colour and a word, not a colour alone.
//
// The list is the screen someone scans on a ladder, and scanning a column of
// percentages means reading every one. A filled dot is read peripherally, so
// "which of these is finished" becomes a glance rather than a pass. The word
// is there because colour alone fails for the roughly one man in twelve with
// a colour vision deficiency, and because it survives a washed-out screen.
const TONE = {
  done: { dot: 'var(--status-good)', label: 'Done' },
  doing: { dot: 'var(--status-warning)', label: 'In progress' },
  todo: { dot: 'var(--text-muted)', label: 'Not started' },
  na: { dot: 'transparent', label: 'N/A' },
}

export default function TaskStatus({ task, showLabel = false }) {
  const state = taskState(task)
  const tone = TONE[state]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{
          background: tone.dot,
          boxShadow: state === 'na' ? 'inset 0 0 0 1.5px var(--text-muted)' : undefined,
        }}
      />
      {showLabel && (
        <span className="text-[12px] text-[color:var(--text-secondary)]">{tone.label}</span>
      )}
    </span>
  )
}
