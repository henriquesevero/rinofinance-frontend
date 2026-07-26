import { apiClient } from "@/lib/api-client"
import type { Account, AccountInput, AccountPurchase, AccountPurchaseInput, AccountsOverview } from "./types"

export const accountsApi = {
  list: () => apiClient.get<AccountsOverview>("/api/accounts"),
  create: (input: AccountInput) => apiClient.post<Account>("/api/accounts", input),
  update: (id: string, input: AccountInput) => apiClient.put<Account>(`/api/accounts/${id}`, input),
  remove: (id: string) => apiClient.delete(`/api/accounts/${id}`),
  reorder: (ids: string[]) => apiClient.put<void>("/api/accounts/order", { ids }),

  createPurchase: (accountId: string, input: AccountPurchaseInput) =>
    apiClient.post<AccountPurchase>(`/api/accounts/${accountId}/purchases`, input),
  updatePurchase: (id: string, input: AccountPurchaseInput) =>
    apiClient.put<AccountPurchase>(`/api/account-purchases/${id}`, input),
  removePurchase: (id: string) => apiClient.delete(`/api/account-purchases/${id}`),
}
