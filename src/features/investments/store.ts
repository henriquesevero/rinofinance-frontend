import { create } from "zustand"
import { toErrorMessage } from "@/lib/errors"
import { investmentsApi } from "./api"
import type { Asset } from "./types"

interface InvestmentsState {
  assets: Asset[]
  totalPatrimony: number
  isLoading: boolean
  error: string | null
  fetchAssets: () => Promise<void>
  createAsset: (name: string, currentBalance: number) => Promise<void>
  updateAsset: (id: string, name: string, currentBalance: number) => Promise<void>
  toggleAsset: (id: string) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
  // Clears all data back to the empty initial state (used on logout).
  reset: () => void
}

export const useInvestmentsStore = create<InvestmentsState>((set, get) => {
  async function mutate(action: () => Promise<unknown>) {
    try {
      await action()
      await get().fetchAssets()
    } catch (err) {
      set({ error: toErrorMessage(err) })
      throw err
    }
  }

  return {
    assets: [],
    totalPatrimony: 0,
    isLoading: false,
    error: null,

    reset: () => set({ assets: [], totalPatrimony: 0, isLoading: false, error: null }),

    fetchAssets: async () => {
      set({ isLoading: true, error: null })
      try {
        const overview = await investmentsApi.list()
        set({ assets: overview.assets, totalPatrimony: overview.totalPatrimony, isLoading: false })
      } catch (err) {
        set({ isLoading: false, error: toErrorMessage(err) })
      }
    },

    createAsset: (name, currentBalance) => mutate(() => investmentsApi.create(name, currentBalance)),
    updateAsset: (id, name, currentBalance) => mutate(() => investmentsApi.update(id, name, currentBalance)),
    toggleAsset: (id) => mutate(() => investmentsApi.toggle(id)),
    deleteAsset: (id) => mutate(() => investmentsApi.remove(id)),
  }
})
