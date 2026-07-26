import { create } from "zustand"
import { toErrorMessage } from "@/lib/errors"
import { accountsApi } from "./api"
import type { Account, AccountInput, AccountPurchaseInput } from "./types"

interface AccountsState {
  accounts: Account[]
  totalBalance: number
  isLoading: boolean
  error: string | null
  fetchAccounts: () => Promise<void>
  createAccount: (input: AccountInput) => Promise<void>
  updateAccount: (id: string, input: AccountInput) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  reorderAccounts: (ids: string[]) => Promise<void>
  createPurchase: (accountId: string, input: AccountPurchaseInput) => Promise<void>
  updatePurchase: (id: string, input: AccountPurchaseInput) => Promise<void>
  deletePurchase: (id: string) => Promise<void>
  byId: (id?: string) => Account | undefined
  // Clears all data back to the empty initial state (used on logout).
  reset: () => void
}

export const useAccountsStore = create<AccountsState>((set, get) => {
  // Totals (available balance, monthly debit) are computed server-side, so
  // every mutation refetches the overview instead of patching locally.
  async function mutate(action: () => Promise<unknown>) {
    try {
      await action()
      await get().fetchAccounts()
    } catch (err) {
      set({ error: toErrorMessage(err) })
      throw err
    }
  }

  return {
    accounts: [],
    totalBalance: 0,
    isLoading: false,
    error: null,

    reset: () => set({ accounts: [], totalBalance: 0, isLoading: false, error: null }),

    fetchAccounts: async () => {
      set({ isLoading: true, error: null })
      try {
        const overview = await accountsApi.list()
        set({ accounts: overview.accounts, totalBalance: overview.totalBalance, isLoading: false })
      } catch (err) {
        set({ isLoading: false, error: toErrorMessage(err) })
      }
    },

    createAccount: (input) => mutate(() => accountsApi.create(input)),
    updateAccount: (id, input) => mutate(() => accountsApi.update(id, input)),
    deleteAccount: (id) => mutate(() => accountsApi.remove(id)),
    reorderAccounts: (ids) => mutate(() => accountsApi.reorder(ids)),

    createPurchase: (accountId, input) => mutate(() => accountsApi.createPurchase(accountId, input)),
    updatePurchase: (id, input) => mutate(() => accountsApi.updatePurchase(id, input)),
    deletePurchase: (id) => mutate(() => accountsApi.removePurchase(id)),

    byId: (id) => (id ? get().accounts.find((a) => a.id === id) : undefined),
  }
})
