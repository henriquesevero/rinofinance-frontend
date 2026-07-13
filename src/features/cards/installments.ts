import type { InstallmentPurchase, Subscription } from "./types"

const monthYearFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" })

// Computes when an installment purchase finishes: the last installment
// falls on firstInstallmentDate + (totalInstallments - 1) months. Returns
// a short "mês/ano" label (e.g. "out. de 2026") for the "Termina em"
// column. Takes only the two fields it needs so it works for both stored
// purchases and freshly-parsed preview rows.
export function installmentEndLabel(purchase: Pick<InstallmentPurchase, "firstInstallmentDate" | "totalInstallments">): string {
  const [year, month, day] = purchase.firstInstallmentDate.split("-").map(Number)
  if (!year || !month) return "—"
  // month is 1-based in the string; Date wants 0-based. Adding
  // (totalInstallments - 1) to a 0-based month rolls the year over
  // automatically.
  const end = new Date(year, month - 1 + (purchase.totalInstallments - 1), day || 1)
  return monthYearFormatter.format(end)
}

// The installment being billed in the reference month, the way a card
// statement shows it ("Parcela 5/10"). Derived from remaining installments:
// current = total - remaining + 1, clamped to [1, total] so a not-yet-started
// or already-paid purchase still reads sensibly.
export function currentInstallment(
  purchase: Pick<InstallmentPurchase, "totalInstallments" | "remainingInstallments">
): number {
  const current = purchase.totalInstallments - purchase.remainingInstallments + 1
  return Math.min(Math.max(current, 1), purchase.totalInstallments)
}

// Resolves a category id to its display name; "" for none/unknown so those
// items sort to the end. Injected by the caller, which has the store.
export type CategoryNameLookup = (id?: string) => string

// Groups items by category name (A–Z), pushing uncategorized last, and
// breaks ties by the item's own name so each group stays tidy.
function byCategory<T extends { categoryId?: string; name: string }>(
  a: T,
  b: T,
  categoryName: CategoryNameLookup
): number {
  const an = categoryName(a.categoryId)
  const bn = categoryName(b.categoryId)
  if (an !== bn) {
    if (!an) return 1
    if (!bn) return -1
    return an.localeCompare(bn, "pt-BR")
  }
  return a.name.localeCompare(b.name, "pt-BR")
}

export type PurchaseSortKey =
  | "default"
  | "amount-desc"
  | "amount-asc"
  | "count-desc"
  | "count-asc"
  | "category"

export const PURCHASE_SORT_OPTIONS: { value: PurchaseSortKey; label: string }[] = [
  { value: "default", label: "Ordem padrão" },
  { value: "amount-desc", label: "Maior parcela" },
  { value: "amount-asc", label: "Menor parcela" },
  { value: "count-desc", label: "Mais parcelas" },
  { value: "count-asc", label: "Menos parcelas" },
  { value: "category", label: "Categoria" },
]

// One-off (avulsa) purchases are all 1x, so the "parcelas" sorts don't
// apply — only value and category ordering make sense.
export const ONE_OFF_SORT_OPTIONS: { value: PurchaseSortKey; label: string }[] = [
  { value: "default", label: "Ordem padrão" },
  { value: "amount-desc", label: "Maior valor" },
  { value: "amount-asc", label: "Menor valor" },
  { value: "category", label: "Categoria" },
]

// Returns a new sorted array; "default" preserves the server order.
// `categoryName` is required only for the "category" sort.
export function sortPurchases(
  purchases: InstallmentPurchase[],
  sortKey: PurchaseSortKey,
  categoryName: CategoryNameLookup = () => ""
): InstallmentPurchase[] {
  if (sortKey === "default") return purchases
  const sorted = [...purchases]
  switch (sortKey) {
    case "amount-desc":
      return sorted.sort((a, b) => b.installmentAmount - a.installmentAmount)
    case "amount-asc":
      return sorted.sort((a, b) => a.installmentAmount - b.installmentAmount)
    case "count-desc":
      return sorted.sort((a, b) => b.totalInstallments - a.totalInstallments)
    case "count-asc":
      return sorted.sort((a, b) => a.totalInstallments - b.totalInstallments)
    case "category":
      return sorted.sort((a, b) => byCategory(a, b, categoryName))
    default:
      return sorted
  }
}

export type SubscriptionSortKey = "default" | "amount-desc" | "amount-asc" | "name" | "category"

export const SUBSCRIPTION_SORT_OPTIONS: { value: SubscriptionSortKey; label: string }[] = [
  { value: "default", label: "Ordem padrão" },
  { value: "amount-desc", label: "Maior valor" },
  { value: "amount-asc", label: "Menor valor" },
  { value: "name", label: "Nome (A–Z)" },
  { value: "category", label: "Categoria" },
]

// Returns a new sorted array; "default" preserves the server order.
// `categoryName` is required only for the "category" sort.
export function sortSubscriptions(
  subscriptions: Subscription[],
  sortKey: SubscriptionSortKey,
  categoryName: CategoryNameLookup = () => ""
): Subscription[] {
  if (sortKey === "default") return subscriptions
  const sorted = [...subscriptions]
  switch (sortKey) {
    case "amount-desc":
      return sorted.sort((a, b) => b.monthlyAmount - a.monthlyAmount)
    case "amount-asc":
      return sorted.sort((a, b) => a.monthlyAmount - b.monthlyAmount)
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    case "category":
      return sorted.sort((a, b) => byCategory(a, b, categoryName))
    default:
      return sorted
  }
}
