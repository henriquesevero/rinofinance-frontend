import { apiClient } from "@/lib/api-client"
import type { ItemInput, SectionInput, UnfurlResult, WishlistItem, WishlistOverview, WishlistSection } from "./types"

export const wishlistApi = {
  overview: (kind: string) => apiClient.get<WishlistOverview>(`/api/wishlist?kind=${kind}`),
  unfurl: (url: string) => apiClient.get<UnfurlResult>(`/api/wishlist/unfurl?url=${encodeURIComponent(url)}`),
  createSection: (kind: string, input: SectionInput) =>
    apiClient.post<WishlistSection>(`/api/wishlist/sections?kind=${kind}`, input),
  updateSection: (id: string, input: SectionInput) =>
    apiClient.put<WishlistSection>(`/api/wishlist/sections/${id}`, input),
  removeSection: (id: string) => apiClient.delete(`/api/wishlist/sections/${id}`),
  createItem: (kind: string, input: ItemInput) =>
    apiClient.post<WishlistItem>(`/api/wishlist/items?kind=${kind}`, input),
  updateItem: (id: string, input: ItemInput) => apiClient.put<WishlistItem>(`/api/wishlist/items/${id}`, input),
  removeItem: (id: string) => apiClient.delete(`/api/wishlist/items/${id}`),
  reorderItems: (kind: string, ids: string[]) =>
    apiClient.put(`/api/wishlist/items/order?kind=${kind}`, { ids }),
}
