import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from './app/ThemeProvider.tsx'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

// Fade out the launch splash (painted from index.html) once the app has
// mounted, but keep it on screen long enough for its animation to finish so
// it never flickers away half-played.
function hideSplash() {
  const splash = document.getElementById('splash')
  if (!splash) return
  const MIN_VISIBLE_MS = 1600
  const remaining = Math.max(0, MIN_VISIBLE_MS - performance.now())
  window.setTimeout(() => {
    splash.classList.add('rf-splash-hide')
    splash.addEventListener('transitionend', () => splash.remove(), { once: true })
    // Safety net in case the transitionend never fires (e.g. reduced motion).
    window.setTimeout(() => splash.remove(), 700)
  }, remaining)
}
hideSplash()

// Register the service worker for PWA/offline support. Only in production
// builds — during dev the SW would cache stale modules and fight HMR.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failures are non-fatal; the app still works online.
    })
  })
}
