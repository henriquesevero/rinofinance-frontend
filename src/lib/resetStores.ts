import { useCategoriesStore } from "@/features/categories/store"
import { useCardsStore } from "@/features/cards/store"
import { useAccountsStore } from "@/features/accounts/store"
import { useDashboardStore } from "@/features/dashboard/store"
import { useInvestmentsStore } from "@/features/investments/store"

// Wipes every per-user data store back to its empty state. Called on logout
// so the next user (or the next login) never sees the previous session's
// categories, cards, accounts, etc. flash before a fresh fetch resolves.
export function resetDataStores() {
  useCategoriesStore.getState().reset()
  useCardsStore.getState().reset()
  useAccountsStore.getState().reset()
  useDashboardStore.getState().reset()
  useInvestmentsStore.getState().reset()
}
