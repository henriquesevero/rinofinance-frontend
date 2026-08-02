import { apiClient } from "@/lib/api-client"
import type { Asset, AssetInput, AssetsOverview, Provento } from "./types"

export const investmentsApi = {
  list: () => apiClient.get<AssetsOverview>("/api/investments"),
  create: (input: AssetInput) => apiClient.post<Asset>("/api/investments", input),
  update: (id: string, input: AssetInput) => apiClient.put<Asset>(`/api/investments/${id}`, input),
  toggle: (id: string) => apiClient.patch<Asset>(`/api/investments/${id}/toggle`),
  remove: (id: string) => apiClient.delete(`/api/investments/${id}`),
  addProvento: (assetId: string, amount: number, date: string) =>
    apiClient.post<Provento>("/api/investments/proventos", { assetId, amount, date }),
  removeProvento: (id: string) => apiClient.delete(`/api/investments/proventos/${id}`),
}
