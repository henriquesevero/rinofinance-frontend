import type { InstallmentPurchase, Subscription } from "./types"

const monthYearFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" })

export function installmentEndLabel(purchase: Pick<InstallmentPurchase, "firstInstallmentDate" | "totalInstallments">): string {
  const [year, month, day] = purchase.firstInstallmentDate.split("-").map(Number)
  if (!year || !month) return "—"
  const end = new Date(year, month - 1 + (purchase.totalInstallments - 1), day || 1)
  return monthYearFormatter.format(end)
}

export function currentInstallment(
  purchase: Pick<InstallmentPurchase, "totalInstallments" | "remainingInstallments">
): number {
  const current = purchase.totalInstallments - purchase.remainingInstallments + 1
  return Math.min(Math.max(current, 1), purchase.totalInstallments)
}

export type CategoryNameLookup = (id?: string) => string

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
  | "remaining-asc"
  | "remaining-desc"
  | "category"

export const PURCHASE_SORT_OPTIONS: { value: PurchaseSortKey; label: string }[] = [
  { value: "default", label: "Ordem padrão" },
  { value: "amount-desc", label: "Maior parcela" },
  { value: "amount-asc", label: "Menor parcela" },
  { value: "count-desc", label: "Mais parcelas" },
  { value: "count-asc", label: "Menos parcelas" },
  { value: "remaining-asc", label: "Termina antes" },
  { value: "remaining-desc", label: "Termina depois" },
  { value: "category", label: "Categoria" },
]

export const ONE_OFF_SORT_OPTIONS: { value: PurchaseSortKey; label: string }[] = [
  { value: "default", label: "Ordem padrão" },
  { value: "amount-desc", label: "Maior valor" },
  { value: "amount-asc", label: "Menor valor" },
  { value: "category", label: "Categoria" },
]

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
    case "remaining-asc":
      return sorted.sort((a, b) => a.remainingInstallments - b.remainingInstallments)
    case "remaining-desc":
      return sorted.sort((a, b) => b.remainingInstallments - a.remainingInstallments)
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
