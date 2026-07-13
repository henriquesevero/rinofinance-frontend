import { create } from "zustand"
import { toErrorMessage } from "@/lib/errors"
import { categoriesApi } from "./api"
import type { Category, CategoryInput } from "./types"

interface CategoriesState {
  categories: Category[]
  isLoading: boolean
  error: string | null
  fetchCategories: () => Promise<void>
  createCategory: (input: CategoryInput) => Promise<void>
  updateCategory: (id: string, input: CategoryInput) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  reorderCategories: (ids: string[]) => Promise<void>
  // Lookup helper for rendering an item's category chip.
  byId: (id?: string) => Category | undefined
  // Clears all data back to the empty initial state (used on logout).
  reset: () => void
}

export const useCategoriesStore = create<CategoriesState>((set, get) => {
  async function mutate(action: () => Promise<unknown>) {
    try {
      await action()
      await get().fetchCategories()
    } catch (err) {
      set({ error: toErrorMessage(err) })
      throw err
    }
  }

  return {
    categories: [],
    isLoading: false,
    error: null,

    fetchCategories: async () => {
      set({ isLoading: true, error: null })
      try {
        const categories = await categoriesApi.list()
        set({ categories, isLoading: false })
      } catch (err) {
        set({ isLoading: false, error: toErrorMessage(err) })
      }
    },

    createCategory: (input) => mutate(() => categoriesApi.create(input)),
    updateCategory: (id, input) => mutate(() => categoriesApi.update(id, input)),
    deleteCategory: (id) => mutate(() => categoriesApi.remove(id)),
    reorderCategories: (ids) => mutate(() => categoriesApi.reorder(ids)),

    byId: (id) => (id ? get().categories.find((c) => c.id === id) : undefined),

    reset: () => set({ categories: [], isLoading: false, error: null }),
  }
})
