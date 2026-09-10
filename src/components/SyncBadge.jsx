import { CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react'

// One of exactly four states, and never a tick that means "typed". The
// number on screen is optimistic; this is the thing that tells the truth
// about whether it left the phone.
export default function SyncBadge({ status, pending = 0 }) {
  const map = {
    saved: { Icon: Check, text: 'Saved', className: 'text-accent' },
    saving: { Icon: RefreshCw, text: 'Saving…', className: 'text-ink-2' },
    offline: { Icon: CloudOff, text: pending ? `Queued (${pending})` : 'Offline', className: 'text-warn' },
    error: { Icon: AlertTriangle, text: 'Not saved', className: 'text-crit' },
  }
  const { Icon, text, className } = map[status] ?? map.saved
  return (
    <span className={`inline-flex items-center gap-2 text-xs ${className}`}>
      <Icon size={14} aria-hidden="true" />
      {text}
    </span>
  )
}
