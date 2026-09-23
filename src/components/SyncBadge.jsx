import { CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react'

// One of exactly four states, and never a tick that means "typed". The
// number on screen is optimistic; this is the thing that tells the truth
// about whether it left the phone.
//
// Icon only, no label next to it — this sits in the top bar on every
// screen, and "Saved" written out next to a checkmark on every single
// screen was saying the same word so often it stopped meaning anything.
// The state is still fully available: aria-label carries it for a screen
// reader, and title gives a hover/long-press hint with the same text a
// visible label used to show (queued count, "Not saved", etc.).
export default function SyncBadge({ status, pending = 0 }) {
  const map = {
    saved: { Icon: Check, text: 'Saved', className: 'text-accent' },
    saving: { Icon: RefreshCw, text: 'Saving…', className: 'text-ink-2' },
    offline: { Icon: CloudOff, text: pending ? `Queued (${pending})` : 'Offline', className: 'text-warn' },
    error: { Icon: AlertTriangle, text: 'Not saved', className: 'text-crit' },
  }
  const { Icon, text, className } = map[status] ?? map.saved
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center ${className}`}
      role="status"
      aria-label={text}
      title={text}
    >
      <Icon size={18} aria-hidden="true" />
    </span>
  )
}
