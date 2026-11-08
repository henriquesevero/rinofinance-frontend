import { apiClient } from "@/lib/api-client"
import type { Debt, DebtInput, RegisterPaymentsInput } from "./types"

export const debtsApi = {
  list: () => apiClient.get<{ debts: Debt[] }>("/api/debts"),
  create: (input: DebtInput) => apiClient.post<Debt>("/api/debts", input),
  update: (id: string, input: DebtInput) => apiClient.put<Debt>(`/api/debts/${id}`, input),
  remove: (id: string) => apiClient.delete(`/api/debts/${id}`),
  registerPayments: (id: string, input: RegisterPaymentsInput) =>
    apiClient.post<Debt>(`/api/debts/${id}/payments`, input),
  removePayment: (id: string, number: number) => apiClient.delete(`/api/debts/${id}/payments/${number}`),
}
