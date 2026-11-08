import { create } from "zustand"
import { toErrorMessage } from "@/lib/errors"
import { debtsApi } from "./api"
import type { Debt, DebtInput, RegisterPaymentsInput } from "./types"

interface DebtsState {
  debts: Debt[]
  isLoading: boolean
  error: string | null
  fetchDebts: () => Promise<void>
  createDebt: (input: DebtInput) => Promise<void>
  updateDebt: (id: string, input: DebtInput) => Promise<void>
  deleteDebt: (id: string) => Promise<void>
  registerPayments: (id: string, input: RegisterPaymentsInput) => Promise<void>
  removePayment: (id: string, number: number) => Promise<void>
  reset: () => void
}

export const useDebtsStore = create<DebtsState>((set, get) => {
  async function mutate(action: () => Promise<unknown>) {
    await action()
    await get().fetchDebts()
  }

  return {
    debts: [],
    isLoading: false,
    error: null,

    reset: () => set({ debts: [], isLoading: false, error: null }),

    fetchDebts: async () => {
      set({ isLoading: true, error: null })
      try {
        const { debts } = await debtsApi.list()
        set({ debts, isLoading: false })
      } catch (err) {
        set({ isLoading: false, error: toErrorMessage(err) })
      }
    },

    createDebt: (input) => mutate(() => debtsApi.create(input)),
    updateDebt: (id, input) => mutate(() => debtsApi.update(id, input)),
    deleteDebt: (id) => mutate(() => debtsApi.remove(id)),
    registerPayments: (id, input) => mutate(() => debtsApi.registerPayments(id, input)),
    removePayment: (id, number) => mutate(() => debtsApi.removePayment(id, number)),
  }
})
