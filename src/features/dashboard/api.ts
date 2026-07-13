import { apiClient } from "@/lib/api-client"
import type { DashboardSummary, Expense, Income } from "./types"

export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummary>("/api/dashboard/summary"),
}

export const incomeApi = {
  create: (name: string, amount: number, categoryId: string) =>
    apiClient.post<Income>("/api/incomes", { name, amount, categoryId }),
  createAccountLinked: (name: string, accountId: string, categoryId: string) =>
    apiClient.post<Income>("/api/incomes/account-linked", { name, accountId, categoryId }),
  update: (id: string, name: string, amount: number, categoryId: string) =>
    apiClient.put<Income>(`/api/incomes/${id}`, { name, amount, categoryId }),
  toggle: (id: string) => apiClient.patch<Income>(`/api/incomes/${id}/toggle`),
  toggleReceived: (id: string) => apiClient.patch<Income>(`/api/incomes/${id}/received`),
  remove: (id: string) => apiClient.delete(`/api/incomes/${id}`),
  reorder: (ids: string[]) => apiClient.put<void>("/api/incomes/order", { ids }),
}

export const expenseApi = {
  create: (name: string, amount: number, categoryId: string) =>
    apiClient.post<Expense>("/api/expenses", { name, amount, categoryId }),
  createCardLinked: (name: string, cardId: string, categoryId: string) =>
    apiClient.post<Expense>("/api/expenses/card-linked", { name, cardId, categoryId }),
  createAccountLinked: (name: string, accountId: string, categoryId: string) =>
    apiClient.post<Expense>("/api/expenses/account-linked", { name, accountId, categoryId }),
  update: (id: string, name: string, amount: number, categoryId: string) =>
    apiClient.put<Expense>(`/api/expenses/${id}`, { name, amount, categoryId }),
  toggle: (id: string) => apiClient.patch<Expense>(`/api/expenses/${id}/toggle`),
  togglePaid: (id: string) => apiClient.patch<Expense>(`/api/expenses/${id}/paid`),
  remove: (id: string) => apiClient.delete(`/api/expenses/${id}`),
  reorder: (ids: string[]) => apiClient.put<void>("/api/expenses/order", { ids }),
}
