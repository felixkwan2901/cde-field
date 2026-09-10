import { useEffect, useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import TabBar from './TabBar'

// The frame every screen sits in.
//
// This is a fixed shell with one scrolling panel between two bars, not a
// document that scrolls under a sticky header. The distinction is the
// whole reason the app reads as an app: the bars never move, the scroll
// stops where the content stops, and a hard flick at the top bounces the
// list rather than peeling the interface off the status bar.
//
// Two title treatments, following what every phone OS does:
//
//   Root screens (a tab)   large title in the scroll flow, no back
//                          chevron, tab bar visible. The title is content
//                          — you scroll it away and get the space back.
//
//   Pushed screens         inline title in the bar, back chevron, no tab
//                          bar. You are inside something; the way out is
//                          backwards, not sideways.
//
// On a root screen the inline title crossfades in as the large one leaves,
// so the heading is never absent — which is what makes it safe to give the
// large one away to the content.
export default function Screen({
  title,
  subtitle,
  onBack,
  largeTitle = false,
  actions,
  tabs,
  currentTab,
  onSelectTab,
  animation,
  scrollKey,
  children,
}) {
  const scrollRef = useRef(null)
  const sentinelRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)

  // The inline title appears exactly when the large one has gone, which an
  // observer on a sentinel answers directly. A scroll handler would have to
  // guess the crossover point from a pixel offset and would re-run on every
  // frame of a flick to do it.
  //
  // No reset when largeTitle is false: `showInline` short-circuits on it, so
  // a stale value is unreachable, and observing on the next root screen
  // fires immediately with the correct answer anyway.
  useEffect(() => {
    const el = sentinelRef.current
    if (!largeTitle || !el) return
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), {
      root: scrollRef.current,
      threshold: 0,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [largeTitle, title])

  // A pushed screen opens at the top. Without this the new screen inherits
  // wherever the previous one was scrolled to, because it is the same
  // scrolling element underneath.
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [scrollKey])

  const showInline = !largeTitle || scrolled

  return (
    <div className="app-frame">
      <header className={`navbar ${showInline && (scrolled || !largeTitle) ? 'navbar--bordered' : ''}`}>
        <div className="navbar__row">
          {onBack ? (
            <button
              onClick={onBack}
              aria-label="Back"
              className="tap flex items-center justify-center rounded-xl"
            >
              <ChevronLeft size={27} strokeWidth={2.1} />
            </button>
          ) : (
            <span className="w-3" />
          )}
          <div className={`navbar__title min-w-0 flex-1 px-1 ${showInline ? 'navbar__title--shown' : ''}`}>
            <h1 className="truncate text-sm font-medium leading-tight">{title}</h1>
            {subtitle && (
              <p className="truncate text-xs leading-tight text-ink-2">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center">{actions}</div>
        </div>
      </header>

      <div className="app-scroll" ref={scrollRef}>
        <div className={`mx-auto w-full max-w-md px-4 pb-8 ${animation ?? ''}`}>
          {largeTitle && (
            <div className="pb-1 pt-2">
              <h2 className="large-title">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-xs text-ink-2">{subtitle}</p>
              )}
            </div>
          )}
          {/* Sits where the large title ends, so "has it gone?" is a
              question about this element being on screen. */}
          <div ref={sentinelRef} aria-hidden="true" className="h-px" />
          <div className="pt-4">{children}</div>
        </div>
      </div>

      {tabs && <TabBar tabs={tabs} current={currentTab} onSelect={onSelectTab} />}
    </div>
  )
}
