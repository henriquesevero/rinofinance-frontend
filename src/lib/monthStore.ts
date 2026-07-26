import { create } from "zustand"

// The month currently being viewed across the whole app, as "YYYY-MM". Reads
// (dashboard summary, cards, accounts) send it as ?month= so every screen
// reflects the selected month. Defaults to the current month on each load and
// isn't persisted — a fresh session always opens on "this month".

export function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

// "Julho de 2026" — capitalized, from a "YYYY-MM" string.
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number)
  const s = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface MonthState {
  month: string
  setMonth: (month: string) => void
  // Move by whole months (negative = back, positive = forward).
  shift: (delta: number) => void
  goToCurrent: () => void
}

export const useMonthStore = create<MonthState>((set, get) => ({
  month: currentMonth(),
  setMonth: (month) => set({ month }),
  shift: (delta) => {
    const [y, m] = get().month.split("-").map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    set({ month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` })
  },
  goToCurrent: () => set({ month: currentMonth() }),
}))
