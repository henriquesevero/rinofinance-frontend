import { create } from "zustand"
import { toErrorMessage } from "@/lib/errors"
import { useMonthStore } from "@/lib/monthStore"
import { cardsApi } from "./api"
import type {
  CardInput,
  CardOverview,
  ClearCardPayload,
  ClearCardResult,
  ImportFaturaPayload,
  ImportFaturaResult,
  InstallmentPurchaseInput,
  SubscriptionInput,
} from "./types"

interface CardsState {
  cards: CardOverview[]
  grandTotal: number
  isLoading: boolean
  error: string | null
  fetchCards: () => Promise<void>
  createCard: (input: CardInput) => Promise<void>
  updateCard: (id: string, input: CardInput) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  createInstallmentPurchase: (cardId: string, input: InstallmentPurchaseInput) => Promise<void>
  updateInstallmentPurchase: (id: string, input: InstallmentPurchaseInput) => Promise<void>
  toggleInstallmentPurchaseFlag: (id: string) => Promise<void>
  toggleInstallmentPurchaseOwed: (id: string) => Promise<void>
  deleteInstallmentPurchase: (id: string) => Promise<void>
  createSubscription: (cardId: string, input: SubscriptionInput) => Promise<void>
  updateSubscription: (id: string, input: SubscriptionInput) => Promise<void>
  deleteSubscription: (id: string) => Promise<void>
  importFatura: (cardId: string, payload: ImportFaturaPayload) => Promise<ImportFaturaResult>
  clearCard: (cardId: string, payload: ClearCardPayload) => Promise<ClearCardResult>
  reorderCards: (orderedIds: string[]) => Promise<void>
  reorderInstallmentPurchases: (cardId: string, ids: string[]) => Promise<void>
  reorderSubscriptions: (cardId: string, ids: string[]) => Promise<void>
  reset: () => void
}

export const useCardsStore = create<CardsState>((set, get) => {
  async function mutate(action: () => Promise<unknown>) {
    try {
      await action()
      await get().fetchCards()
    } catch (err) {
      set({ error: toErrorMessage(err) })
      throw err
    }
  }

  return {
    cards: [],
    grandTotal: 0,
    isLoading: false,
    error: null,

    reset: () => set({ cards: [], grandTotal: 0, isLoading: false, error: null }),

    fetchCards: async () => {
      set({ isLoading: true, error: null })
      try {
        const overview = await cardsApi.list(useMonthStore.getState().month)
        set({ cards: overview.cards, grandTotal: overview.grandTotal, isLoading: false })
      } catch (err) {
        set({ isLoading: false, error: toErrorMessage(err) })
      }
    },

    createCard: (input) => mutate(() => cardsApi.create(input)),
    updateCard: (id, input) => mutate(() => cardsApi.update(id, input)),
    deleteCard: (id) => mutate(() => cardsApi.remove(id)),

    createInstallmentPurchase: (cardId, input) => mutate(() => cardsApi.createInstallmentPurchase(cardId, input)),
    updateInstallmentPurchase: (id, input) => mutate(() => cardsApi.updateInstallmentPurchase(id, input)),
    toggleInstallmentPurchaseFlag: (id) => mutate(() => cardsApi.toggleInstallmentPurchaseFlag(id)),
    toggleInstallmentPurchaseOwed: (id) => mutate(() => cardsApi.toggleInstallmentPurchaseOwed(id)),
    deleteInstallmentPurchase: (id) => mutate(() => cardsApi.removeInstallmentPurchase(id)),

    createSubscription: (cardId, input) => mutate(() => cardsApi.createSubscription(cardId, input)),
    updateSubscription: (id, input) => mutate(() => cardsApi.updateSubscription(id, input)),
    deleteSubscription: (id) => mutate(() => cardsApi.removeSubscription(id)),

    importFatura: async (cardId, payload) => {
      try {
        const result = await cardsApi.importFatura(cardId, payload)
        await get().fetchCards()
        return result
      } catch (err) {
        set({ error: toErrorMessage(err) })
        throw err
      }
    },

    clearCard: async (cardId, payload) => {
      try {
        const result = await cardsApi.clearCard(cardId, payload, useMonthStore.getState().month)
        await get().fetchCards()
        return result
      } catch (err) {
        set({ error: toErrorMessage(err) })
        throw err
      }
    },

    reorderCards: async (orderedIds) => {
      const previous = get().cards
      const byId = new Map(previous.map((c) => [c.id, c]))
      const reordered = orderedIds.map((id) => byId.get(id)).filter((c): c is CardOverview => Boolean(c))
      set({ cards: reordered })
      try {
        await cardsApi.reorder(orderedIds)
      } catch (err) {
        set({ error: toErrorMessage(err) })
        await get().fetchCards()
        throw err
      }
    },

    reorderInstallmentPurchases: (cardId, ids) =>
      mutate(() => cardsApi.reorderInstallmentPurchases(cardId, ids)),
    reorderSubscriptions: (cardId, ids) => mutate(() => cardsApi.reorderSubscriptions(cardId, ids)),
  }
})
