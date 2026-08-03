import { useCategoriesStore } from "@/features/categories/store"
import { useCardsStore } from "@/features/cards/store"
import { useAccountsStore } from "@/features/accounts/store"
import { useDashboardStore } from "@/features/dashboard/store"
import { useInvestmentsStore } from "@/features/investments/store"
import { useBelongingsStore, useWishlistStore } from "@/features/wishlist/store"

export function resetDataStores() {
  useCategoriesStore.getState().reset()
  useCardsStore.getState().reset()
  useAccountsStore.getState().reset()
  useDashboardStore.getState().reset()
  useInvestmentsStore.getState().reset()
  useWishlistStore.getState().reset()
  useBelongingsStore.getState().reset()
}
