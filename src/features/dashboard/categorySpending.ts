import type { CardOverview, InstallmentPurchase } from "@/features/cards/types"
import type { Category } from "@/features/categories/types"
import type { Expense } from "./types"

export interface CategorySlice {
  id: string
  name: string
  color: string
  icon?: string
  total: number
}

const UNCATEGORIZED = { id: "__none__", name: "Sem categoria", color: "#9CA3AF" }

function isActiveThisMonth(p: Pick<InstallmentPurchase, "firstInstallmentDate" | "totalInstallments">): boolean {
  const [year, month] = p.firstInstallmentDate.split("-").map(Number)
  if (!year || !month) return false
  const now = new Date()
  const elapsed = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
  return elapsed >= 0 && elapsed < p.totalInstallments
}

// Sums the current month's spending grouped by category, across card
// installments (active this month), subscriptions and standalone expenses.
// Card-linked expenses are skipped because their amount already mirrors a
// card's total, which we count via the card's own items — counting both
// would double up.
export function computeCategorySpending(
  cards: CardOverview[],
  expenses: Expense[],
  categories: Category[]
): { slices: CategorySlice[]; total: number } {
  const totals = new Map<string, number>()
  const add = (categoryId: string | undefined, amount: number) => {
    if (amount <= 0) return
    const key = categoryId || UNCATEGORIZED.id
    totals.set(key, (totals.get(key) ?? 0) + amount)
  }

  for (const card of cards) {
    for (const p of card.installmentPurchases) {
      if (isActiveThisMonth(p)) add(p.categoryId, p.installmentAmount)
    }
    for (const s of card.subscriptions) {
      add(s.categoryId, s.monthlyAmount)
    }
  }
  for (const e of expenses) {
    if (e.active && !e.cardId) add(e.categoryId, e.amount)
  }

  const byId = new Map(categories.map((c) => [c.id, c]))
  const slices: CategorySlice[] = [...totals.entries()]
    .map(([id, total]) => {
      if (id === UNCATEGORIZED.id) return { ...UNCATEGORIZED, total }
      const cat = byId.get(id)
      return cat
        ? { id: cat.id, name: cat.name, color: cat.color, icon: cat.icon, total }
        : { ...UNCATEGORIZED, total }
    })
    // Merge any deleted-category leftovers into the uncategorized bucket.
    .reduce<CategorySlice[]>((acc, slice) => {
      const existing = acc.find((s) => s.id === slice.id)
      if (existing) existing.total += slice.total
      else acc.push(slice)
      return acc
    }, [])
    .sort((a, b) => b.total - a.total)

  const total = slices.reduce((sum, s) => sum + s.total, 0)
  return { slices, total }
}
