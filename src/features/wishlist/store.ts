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
  reorderSections: (ids: string[]) => Promise<void>
  createItem: (input: ItemInput) => Promise<void>
  updateItem: (id: string, input: ItemInput) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  reorderItems: (ids: string[]) => Promise<void>
  reorderPriority: (ids: string[]) => Promise<void>
  moveItem: (
    dragId: string,
    targetSectionId: string,
    newItems: WishlistItem[],
    orderedIds: string[],
    changedSection: boolean
  ) => void
  reset: () => void
}

export function createListStore(kind: string) {
  return create<WishlistState>((set, get) => {
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
          const overview = await wishlistApi.overview(kind)
          set({ sections: overview.sections, items: overview.items, total: overview.total, isLoading: false })
        } catch (err) {
          set({ isLoading: false, error: toErrorMessage(err) })
        }
      },

      createSection: (input) => mutate(() => wishlistApi.createSection(kind, input)),
      updateSection: (id, input) => mutate(() => wishlistApi.updateSection(id, input)),
      deleteSection: (id) => mutate(() => wishlistApi.removeSection(id)),
      reorderSections: (ids) => mutate(() => wishlistApi.reorderSections(kind, ids)),
      createItem: (input) => mutate(() => wishlistApi.createItem(kind, input)),
      updateItem: (id, input) => mutate(() => wishlistApi.updateItem(id, input)),
      deleteItem: (id) => mutate(() => wishlistApi.removeItem(id)),
      reorderItems: (ids) => mutate(() => wishlistApi.reorderItems(kind, ids)),
      reorderPriority: (ids) => mutate(() => wishlistApi.reorderPriority(kind, ids)),

      moveItem: (dragId, targetSectionId, newItems, orderedIds, changedSection) => {
        const moved = newItems.find((i) => i.id === dragId)
        set({ items: newItems })
        void (async () => {
          try {
            if (changedSection && moved) {
              await wishlistApi.updateItem(dragId, {
                name: moved.name,
                url: moved.url ?? "",
                price: moved.price,
                imageUrl: moved.imageUrl ?? "",
                logoUrl: moved.logoUrl ?? "",
                sectionId: targetSectionId,
              })
            }
            await wishlistApi.reorderItems(kind, orderedIds)
          } catch (err) {
            set({ error: toErrorMessage(err) })
            await get().fetchWishlist()
          }
        })()
      },

      reset: () => set({ sections: [], items: [], total: 0, isLoading: false, error: null }),
    }
  })
}

export const useWishlistStore = createListStore("wishlist")
export const useBelongingsStore = createListStore("owned")
