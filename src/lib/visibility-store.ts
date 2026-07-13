import { create } from "zustand"

const STORAGE_KEY = "rinofinance:values-hidden"

function loadInitial(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "1"
}

interface VisibilityState {
  hidden: boolean
  toggle: () => void
}

// Global, persisted "hide monetary values" preference — the eye toggle
// familiar from banking apps. Lives outside any feature store since it
// affects every screen (dashboard, cards, investments) uniformly.
export const useVisibilityStore = create<VisibilityState>((set, get) => ({
  hidden: loadInitial(),
  toggle: () => {
    const next = !get().hidden
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
    set({ hidden: next })
  },
}))
