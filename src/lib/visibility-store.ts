import { create } from "zustand"

const STORAGE_KEY = "rinofinance:values-hidden"

function loadInitial(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "1"
}

interface VisibilityState {
  hidden: boolean
  toggle: () => void
}

export const useVisibilityStore = create<VisibilityState>((set, get) => ({
  hidden: loadInitial(),
  toggle: () => {
    const next = !get().hidden
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
    set({ hidden: next })
  },
}))
