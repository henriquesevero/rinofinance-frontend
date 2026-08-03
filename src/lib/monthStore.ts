import { create } from "zustand"

export function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number)
  const s = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface MonthState {
  month: string
  setMonth: (month: string) => void
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
