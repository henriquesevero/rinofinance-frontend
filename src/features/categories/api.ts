import { apiClient } from "@/lib/api-client"
import type { Category, CategoryInput } from "./types"

export const categoriesApi = {
  list: () => apiClient.get<Category[]>("/api/categories"),
  create: (input: CategoryInput) => apiClient.post<Category>("/api/categories", input),
  update: (id: string, input: CategoryInput) => apiClient.put<Category>(`/api/categories/${id}`, input),
  remove: (id: string) => apiClient.delete(`/api/categories/${id}`),
  reorder: (ids: string[]) => apiClient.put<void>("/api/categories/order", { ids }),
}
