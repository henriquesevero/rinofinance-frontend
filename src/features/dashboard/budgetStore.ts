import { create } from "zustand"

const STORAGE_KEY = "rinofinance:monthly-budget"

function load(): number {
  if (typeof localStorage === "undefined") return 0
  const raw = localStorage.getItem(STORAGE_KEY)
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) && n > 0 ? n : 0
}

interface BudgetState {
  // Monthly spending ceiling the user sets, in reais. 0 means "not set yet".
  budget: number
  setBudget: (value: number) => void
}

// The monthly budget (spending ceiling) powering the "Você ainda pode gastar"
// card. Persisted in localStorage so it survives reloads. It's a per-device
// preference for now — it doesn't sync across browsers/devices.
export const useBudgetStore = create<BudgetState>((set) => ({
  budget: load(),
  setBudget: (value) => {
    const v = Number.isFinite(value) && value > 0 ? value : 0
    if (typeof localStorage !== "undefined") {
      if (v > 0) localStorage.setItem(STORAGE_KEY, String(v))
      else localStorage.removeItem(STORAGE_KEY)
    }
    set({ budget: v })
  },
}))
