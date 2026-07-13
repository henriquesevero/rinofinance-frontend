import { create } from "zustand"

const STORAGE_KEY = "rinofinance:charts-hidden"

function loadInitial(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "1"
}

interface ChartsPrefState {
  hidden: boolean
  toggle: () => void
}

// Persisted "hide dashboard charts" preference, so users who prefer the
// lists-only view keep it across sessions.
export const useChartsPrefStore = create<ChartsPrefState>((set, get) => ({
  hidden: loadInitial(),
  toggle: () => {
    const next = !get().hidden
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
    set({ hidden: next })
  },
}))
