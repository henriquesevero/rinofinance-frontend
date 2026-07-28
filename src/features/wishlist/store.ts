import { create } from "zustand"
import { toErrorMessage } from "@/lib/errors"
import { wishlistApi } from "./api"
import type { ItemInput, SectionInput, WishlistItem, WishlistSection } from "./types"

interface WishlistState {
  sections: WishlistSection[]
  items: WishlistItem[]
  total: number
  isLoading: boolean
  error: string | null
  fetchWishlist: () => Promise<void>
  createSection: (input: SectionInput) => Promise<void>
  updateSection: (id: string, input: SectionInput) => Promise<void>
  deleteSection: (id: string) => Promise<void>
  createItem: (input: ItemInput) => Promise<void>
  updateItem: (id: string, input: ItemInput) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  reset: () => void
}

export const useWishlistStore = create<WishlistState>((set, get) => {
  async function mutate(action: () => Promise<unknown>) {
    try {
      await action()
      await get().fetchWishlist()
    } catch (err) {
      set({ error: toErrorMessage(err) })
      throw err
    }
  }

  return {
    sections: [],
    items: [],
    total: 0,
    isLoading: false,
    error: null,

    fetchWishlist: async () => {
      set({ isLoading: true, error: null })
      try {
        const overview = await wishlistApi.overview()
        set({ sections: overview.sections, items: overview.items, total: overview.total, isLoading: false })
      } catch (err) {
        set({ isLoading: false, error: toErrorMessage(err) })
      }
    },

    createSection: (input) => mutate(() => wishlistApi.createSection(input)),
    updateSection: (id, input) => mutate(() => wishlistApi.updateSection(id, input)),
    deleteSection: (id) => mutate(() => wishlistApi.removeSection(id)),
    createItem: (input) => mutate(() => wishlistApi.createItem(input)),
    updateItem: (id, input) => mutate(() => wishlistApi.updateItem(id, input)),
    deleteItem: (id) => mutate(() => wishlistApi.removeItem(id)),

    reset: () => set({ sections: [], items: [], total: 0, isLoading: false, error: null }),
  }
})
