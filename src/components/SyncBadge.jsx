import { CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react'

// One of exactly four states, and never a tick that means "typed". The
// number on screen is optimistic; this is the thing that tells the truth
// about whether it left the phone.
export default function SyncBadge({ status, pending = 0 }) {
  const map = {
    saved: { Icon: Check, text: 'Saved', className: 'text-[color:var(--status-good)]' },
    saving: { Icon: RefreshCw, text: 'Saving…', className: 'text-[color:var(--text-secondary)]' },
    offline: { Icon: CloudOff, text: pending ? `Queued (${pending})` : 'Offline', className: 'text-[color:var(--status-warning)]' },
    error: { Icon: AlertTriangle, text: 'Not saved', className: 'text-[color:var(--status-critical)]' },
  }
  const { Icon, text, className } = map[status] ?? map.saved
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] ${className}`}>
      <Icon size={14} aria-hidden="true" />
      {text}
    </span>
  )
}
