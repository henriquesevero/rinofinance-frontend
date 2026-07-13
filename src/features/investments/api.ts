import { apiClient } from "@/lib/api-client"
import type { Asset, AssetsOverview } from "./types"

export const investmentsApi = {
  list: () => apiClient.get<AssetsOverview>("/api/investments"),
  create: (name: string, currentBalance: number) =>
    apiClient.post<Asset>("/api/investments", { name, currentBalance }),
  update: (id: string, name: string, currentBalance: number) =>
    apiClient.put<Asset>(`/api/investments/${id}`, { name, currentBalance }),
  toggle: (id: string) => apiClient.patch<Asset>(`/api/investments/${id}/toggle`),
  remove: (id: string) => apiClient.delete(`/api/investments/${id}`),
}
