import { apiClient } from "@/lib/api-client"
import type {
  CardInput,
  CardOverview,
  CardsOverview,
  ClearCardPayload,
  ClearCardResult,
  ImportFaturaPayload,
  ImportFaturaResult,
  InstallmentPurchase,
  InstallmentPurchaseInput,
  Subscription,
  SubscriptionInput,
} from "./types"

export const cardsApi = {
  list: (month?: string) => apiClient.get<CardsOverview>(`/api/cards${month ? `?month=${month}` : ""}`),
  create: (input: CardInput) => apiClient.post<CardOverview>("/api/cards", input),
  update: (id: string, input: CardInput) => apiClient.put<CardOverview>(`/api/cards/${id}`, input),
  remove: (id: string) => apiClient.delete(`/api/cards/${id}`),
  importFatura: (cardId: string, payload: ImportFaturaPayload) =>
    apiClient.post<ImportFaturaResult>(`/api/cards/${cardId}/import`, payload),
  clearCard: (cardId: string, payload: ClearCardPayload, month?: string) =>
    apiClient.post<ClearCardResult>(`/api/cards/${cardId}/clear${month ? `?month=${month}` : ""}`, payload),
  reorder: (cardIds: string[]) => apiClient.put<void>("/api/cards/order", { cardIds }),
  reorderInstallmentPurchases: (cardId: string, ids: string[]) =>
    apiClient.put<void>(`/api/cards/${cardId}/installment-purchases/order`, { ids }),
  reorderSubscriptions: (cardId: string, ids: string[]) =>
    apiClient.put<void>(`/api/cards/${cardId}/subscriptions/order`, { ids }),

  createInstallmentPurchase: (cardId: string, input: InstallmentPurchaseInput) =>
    apiClient.post<InstallmentPurchase>(`/api/cards/${cardId}/installment-purchases`, input),
  updateInstallmentPurchase: (id: string, input: InstallmentPurchaseInput) =>
    apiClient.put<InstallmentPurchase>(`/api/installment-purchases/${id}`, input),
  toggleInstallmentPurchaseFlag: (id: string) =>
    apiClient.patch<InstallmentPurchase>(`/api/installment-purchases/${id}/flag`),
  toggleInstallmentPurchaseOwed: (id: string) =>
    apiClient.patch<InstallmentPurchase>(`/api/installment-purchases/${id}/owed-exclusion`),
  removeInstallmentPurchase: (id: string) => apiClient.delete(`/api/installment-purchases/${id}`),

  createSubscription: (cardId: string, input: SubscriptionInput) =>
    apiClient.post<Subscription>(`/api/cards/${cardId}/subscriptions`, input),
  updateSubscription: (id: string, input: SubscriptionInput) =>
    apiClient.put<Subscription>(`/api/subscriptions/${id}`, input),
  removeSubscription: (id: string) => apiClient.delete(`/api/subscriptions/${id}`),
}
