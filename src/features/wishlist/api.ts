import { apiClient } from "@/lib/api-client"
import type { ItemInput, SectionInput, WishlistItem, WishlistOverview, WishlistSection } from "./types"

export const wishlistApi = {
  overview: () => apiClient.get<WishlistOverview>("/api/wishlist"),
  createSection: (input: SectionInput) => apiClient.post<WishlistSection>("/api/wishlist/sections", input),
  updateSection: (id: string, input: SectionInput) =>
    apiClient.put<WishlistSection>(`/api/wishlist/sections/${id}`, input),
  removeSection: (id: string) => apiClient.delete(`/api/wishlist/sections/${id}`),
  createItem: (input: ItemInput) => apiClient.post<WishlistItem>("/api/wishlist/items", input),
  updateItem: (id: string, input: ItemInput) => apiClient.put<WishlistItem>(`/api/wishlist/items/${id}`, input),
  removeItem: (id: string) => apiClient.delete(`/api/wishlist/items/${id}`),
}
