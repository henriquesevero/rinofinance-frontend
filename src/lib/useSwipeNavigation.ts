import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

// Mobile-only left/right swipe to move between the top-level pages, in the
// given route order (swipe left → next page, swipe right → previous).
//
// Built to never fight other gestures. It only ever navigates on release, and
// only for a decisive, quick, mostly-horizontal flick. It bails out entirely
// when the gesture:
//   - is multi-touch (pinch/zoom),
//   - starts inside a horizontally-scrollable region (charts, tables),
//   - starts on a draggable, a form control, or a slider,
//   - starts inside a dialog/menu (modals, dropdowns),
//   - starts at the very screen edge (browser back/forward gestures),
//   - or is opted out via a `data-swipe-ignore` ancestor.
// Because it never calls preventDefault, native vertical scrolling and inner
// horizontal scrolling keep working untouched.
export function useSwipeNavigation(routes: string[]) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let startX = 0
    let startY = 0
    let startT = 0
    let tracking = false
    let ignore = false

    const isMobile = () => window.matchMedia("(max-width: 767px)").matches

    function shouldIgnore(target: EventTarget | null): boolean {
      let el = target as Element | null
      for (let depth = 0; el && el !== document.body && depth < 40; depth++, el = el.parentElement) {
        if (el instanceof HTMLElement && "swipeIgnore" in el.dataset) return true
        if (el.getAttribute("draggable") === "true") return true
        const tag = el.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
        const role = el.getAttribute("role")
        if (role === "dialog" || role === "menu" || role === "slider") return true
        const overflowX = getComputedStyle(el).overflowX
        if ((overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth + 2) return true
      }
      return false
    }

    function onStart(e: TouchEvent) {
      if (e.touches.length !== 1 || !isMobile()) {
        tracking = false
        return
      }
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
      startT = Date.now()
      // Leave the outer ~24px to the browser's own edge back/forward gestures.
      ignore = startX < 24 || startX > window.innerWidth - 24 || shouldIgnore(e.target)
      tracking = true
    }

    function onMove(e: TouchEvent) {
      if (e.touches.length > 1) tracking = false
    }

    function onEnd(e: TouchEvent) {
      if (!tracking) return
      tracking = false
      if (ignore) return

      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY

      if (Date.now() - startT > 600) return // too slow to be a flick
      if (Math.abs(dx) < 70) return // too short
      if (Math.abs(dx) < Math.abs(dy) * 1.7) return // not clearly horizontal

      const idx = routes.indexOf(location.pathname)
      if (idx === -1) return // only between top-level tab pages, not detail views

      const next = dx < 0 ? idx + 1 : idx - 1
      if (next < 0 || next >= routes.length) return
      navigate(routes[next], { viewTransition: true })
    }

    document.addEventListener("touchstart", onStart, { passive: true })
    document.addEventListener("touchmove", onMove, { passive: true })
    document.addEventListener("touchend", onEnd, { passive: true })
    return () => {
      document.removeEventListener("touchstart", onStart)
      document.removeEventListener("touchmove", onMove)
      document.removeEventListener("touchend", onEnd)
    }
  }, [navigate, location.pathname, routes])
}
