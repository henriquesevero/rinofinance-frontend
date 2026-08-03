import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

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

      if (Date.now() - startT > 600) return
      if (Math.abs(dx) < 70) return
      if (Math.abs(dx) < Math.abs(dy) * 1.7) return

      const idx = routes.indexOf(location.pathname)
      if (idx === -1) return

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
