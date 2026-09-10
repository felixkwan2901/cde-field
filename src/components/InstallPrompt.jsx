import { useEffect, useState } from 'react'
import { Share, X } from 'lucide-react'

// "Add to home screen", which is what turns this from a website into
// something with an icon that opens without browser chrome.
//
// Two paths, because the platforms genuinely differ: Chrome and Edge fire
// beforeinstallprompt and let the page trigger the real installer; iOS Safari
// fires nothing and never will, so the only honest thing there is to describe
// the two taps. Detecting iOS by user agent is normally a smell, but here the
// thing being detected is a missing API with no feature test.
const DISMISSED = 'cdefield.installDismissed'

function alreadyInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

// Whether to offer the manual iOS instructions is knowable before the first
// paint, so it is initial state rather than something an effect switches on
// afterwards.
function shouldHintIos() {
  if (alreadyInstalled()) return false
  try {
    if (sessionStorage.getItem(DISMISSED)) return false
  } catch {
    // Storage blocked; the prompt just reappears next visit.
  }
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)
  return isIos && isSafari
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [showIosHint, setShowIosHint] = useState(shouldHintIos)

  useEffect(() => {
    if (alreadyInstalled()) return undefined
    const onPrompt = (event) => {
      event.preventDefault()
      try {
        if (sessionStorage.getItem(DISMISSED)) return
      } catch {
        // As above.
      }
      setDeferred(event)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  function dismiss() {
    setDeferred(null)
    setShowIosHint(false)
    try {
      sessionStorage.setItem(DISMISSED, '1')
    } catch {
      // As above.
    }
  }

  if (!deferred && !showIosHint) return null

  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-line p-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">Add to your home screen</p>
        {deferred ? (
          <p className="text-xs text-ink-2">
            Opens like an app, without the browser bar.
          </p>
        ) : (
          <p className="flex items-center gap-1 text-xs text-ink-2">
            Tap <Share size={14} aria-hidden="true" /> then “Add to Home Screen”.
          </p>
        )}
      </div>
      {deferred && (
        <button
          onClick={async () => {
            deferred.prompt()
            await deferred.userChoice
            dismiss()
          }}
          className="tap pressable shrink-0 rounded-sm bg-accent px-4 text-xs font-medium text-accent-ink"
        >
          Add
        </button>
      )}
      <button onClick={dismiss} aria-label="Dismiss" className="tap shrink-0 text-ink-2">
        <X size={18} />
      </button>
    </div>
  )
}
