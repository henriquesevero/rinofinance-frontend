import { create } from "zustand"
import { toErrorMessage } from "@/lib/errors"
import { dashboardApi, expenseApi, incomeApi } from "./api"
import type { DashboardSummary } from "./types"

interface DashboardState {
  summary: DashboardSummary | null
  isLoading: boolean
  error: string | null
  fetchSummary: () => Promise<void>
  createIncome: (name: string, amount: number, categoryId: string) => Promise<void>
  createAccountLinkedIncome: (name: string, accountId: string, categoryId: string) => Promise<void>
  updateIncome: (id: string, name: string, amount: number, categoryId: string) => Promise<void>
  toggleIncome: (id: string) => Promise<void>
  toggleIncomeReceived: (id: string) => Promise<void>
  deleteIncome: (id: string) => Promise<void>
  createExpense: (name: string, amount: number, categoryId: string) => Promise<void>
  createCardLinkedExpense: (name: string, cardId: string, categoryId: string) => Promise<void>
  createAccountLinkedExpense: (name: string, accountId: string, categoryId: string) => Promise<void>
  updateExpense: (id: string, name: string, amount: number, categoryId: string) => Promise<void>
  toggleExpense: (id: string) => Promise<void>
  toggleExpensePaid: (id: string) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  reorderIncomes: (ids: string[]) => Promise<void>
  reorderExpenses: (ids: string[]) => Promise<void>
  setAllIncomesActive: (active: boolean) => Promise<void>
  setAllIncomesReceived: (received: boolean) => Promise<void>
  setAllExpensesActive: (active: boolean) => Promise<void>
  setAllExpensesPaid: (paid: boolean) => Promise<void>
  // Clears all data back to the empty initial state (used on logout).
  reset: () => void
}

export const useDashboardStore = create<DashboardState>((set, get) => {
  // Every mutation below re-fetches the whole summary instead of patching
  // local state: totals, active-sum, and card-linked expense amounts are
  // all computed server-side, so refetching is the only way to stay
  // correct without re-implementing that logic in the client.
  async function mutate(action: () => Promise<unknown>) {
    try {
      await action()
      await get().fetchSummary()
    } catch (err) {
      set({ error: toErrorMessage(err) })
      throw err
    }
  }

  return {
    summary: null,
    isLoading: false,
    error: null,

    reset: () => set({ summary: null, isLoading: false, error: null }),

    fetchSummary: async () => {
      set({ isLoading: true, error: null })
      try {
        const summary = await dashboardApi.getSummary()
        set({ summary, isLoading: false })
      } catch (err) {
        set({ isLoading: false, error: toErrorMessage(err) })
      }
    },

    createIncome: (name, amount, categoryId) => mutate(() => incomeApi.create(name, amount, categoryId)),
    createAccountLinkedIncome: (name, accountId, categoryId) =>
      mutate(() => incomeApi.createAccountLinked(name, accountId, categoryId)),
    updateIncome: (id, name, amount, categoryId) => mutate(() => incomeApi.update(id, name, amount, categoryId)),
    toggleIncome: (id) => mutate(() => incomeApi.toggle(id)),
    toggleIncomeReceived: (id) => mutate(() => incomeApi.toggleReceived(id)),
    deleteIncome: (id) => mutate(() => incomeApi.remove(id)),

    createExpense: (name, amount, categoryId) => mutate(() => expenseApi.create(name, amount, categoryId)),
    createCardLinkedExpense: (name, cardId, categoryId) =>
      mutate(() => expenseApi.createCardLinked(name, cardId, categoryId)),
    createAccountLinkedExpense: (name, accountId, categoryId) =>
      mutate(() => expenseApi.createAccountLinked(name, accountId, categoryId)),
    updateExpense: (id, name, amount, categoryId) => mutate(() => expenseApi.update(id, name, amount, categoryId)),
    toggleExpense: (id) => mutate(() => expenseApi.toggle(id)),
    toggleExpensePaid: (id) => mutate(() => expenseApi.togglePaid(id)),
    deleteExpense: (id) => mutate(() => expenseApi.remove(id)),

    reorderIncomes: (ids) => mutate(() => incomeApi.reorder(ids)),
    reorderExpenses: (ids) => mutate(() => expenseApi.reorder(ids)),

    // Bulk mark/unmark: only flip the items that differ from the target,
    // then refetch once. The per-item endpoints are toggles, so items
    // already at the target are left untouched.
    setAllIncomesActive: (active) =>
      mutate(() =>
        Promise.all(
          (get().summary?.incomes ?? []).filter((i) => i.active !== active).map((i) => incomeApi.toggle(i.id))
        )
      ),
    setAllIncomesReceived: (received) =>
      mutate(() =>
        Promise.all(
          (get().summary?.incomes ?? [])
            .filter((i) => i.received !== received)
            .map((i) => incomeApi.toggleReceived(i.id))
        )
      ),
    setAllExpensesActive: (active) =>
      mutate(() =>
        Promise.all(
          (get().summary?.expenses ?? []).filter((e) => e.active !== active).map((e) => expenseApi.toggle(e.id))
        )
      ),
    setAllExpensesPaid: (paid) =>
      mutate(() =>
        Promise.all(
          (get().summary?.expenses ?? []).filter((e) => e.paid !== paid).map((e) => expenseApi.togglePaid(e.id))
        )
      ),
  }
})
