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

function hideSplash() {
  const splash = document.getElementById('splash')
  if (!splash) return
  const MIN_VISIBLE_MS = 1600
  const remaining = Math.max(0, MIN_VISIBLE_MS - performance.now())
  window.setTimeout(() => {
    splash.classList.add('rf-splash-hide')
    splash.addEventListener('transitionend', () => splash.remove(), { once: true })
    window.setTimeout(() => splash.remove(), 700)
  }, remaining)
}
hideSplash()

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
