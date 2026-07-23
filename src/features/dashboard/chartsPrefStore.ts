import { create } from "zustand"

interface ChartsPrefState {
  hidden: boolean
  toggle: () => void
}

// Dashboard charts always start closed on every site open — the user can
// reveal them within the session via the toggle, but it's intentionally not
// persisted, so each fresh load defaults back to the lists-only view.
export const useChartsPrefStore = create<ChartsPrefState>((set, get) => ({
  hidden: true,
  toggle: () => set({ hidden: !get().hidden }),
}))
