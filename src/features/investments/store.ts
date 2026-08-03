import { create } from "zustand"
import { toErrorMessage } from "@/lib/errors"
import { investmentsApi } from "./api"
import type { Asset, AssetInput, Provento } from "./types"

interface InvestmentsState {
  assets: Asset[]
  proventos: Provento[]
  totalPatrimony: number
  totalInvested: number
  totalProventos: number
  isLoading: boolean
  error: string | null
  fetchAssets: () => Promise<void>
  createAsset: (input: AssetInput) => Promise<void>
  updateAsset: (id: string, input: AssetInput) => Promise<void>
  toggleAsset: (id: string) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
  addProvento: (assetId: string, amount: number, date: string) => Promise<void>
  removeProvento: (id: string) => Promise<void>
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
    proventos: [],
    totalPatrimony: 0,
    totalInvested: 0,
    totalProventos: 0,
    isLoading: false,
    error: null,

    reset: () =>
      set({
        assets: [],
        proventos: [],
        totalPatrimony: 0,
        totalInvested: 0,
        totalProventos: 0,
        isLoading: false,
        error: null,
      }),

    fetchAssets: async () => {
      set({ isLoading: true, error: null })
      try {
        const o = await investmentsApi.list()
        set({
          assets: o.assets,
          proventos: o.proventos,
          totalPatrimony: o.totalPatrimony,
          totalInvested: o.totalInvested,
          totalProventos: o.totalProventos,
          isLoading: false,
        })
      } catch (err) {
        set({ isLoading: false, error: toErrorMessage(err) })
      }
    },

    createAsset: (input) => mutate(() => investmentsApi.create(input)),
    updateAsset: (id, input) => mutate(() => investmentsApi.update(id, input)),
    toggleAsset: (id) => mutate(() => investmentsApi.toggle(id)),
    deleteAsset: (id) => mutate(() => investmentsApi.remove(id)),
    addProvento: (assetId, amount, date) => mutate(() => investmentsApi.addProvento(assetId, amount, date)),
    removeProvento: (id) => mutate(() => investmentsApi.removeProvento(id)),
  }
})
