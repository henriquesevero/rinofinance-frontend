import type { CardOverview } from "@/features/cards/types"
import type { Account } from "@/features/accounts/types"

export const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export type SeriesKey = "installments" | "subscriptions" | "oneOff" | "debit"

export interface SeriesMeta {
  key: SeriesKey
  label: string
  color: string
}

export const SERIES: SeriesMeta[] = [
  { key: "installments", label: "Parcelamentos", color: "bg-amber-500" },
  { key: "subscriptions", label: "Assinaturas", color: "bg-violet-500" },
  { key: "oneOff", label: "Avulsas", color: "bg-zinc-400" },
  { key: "debit", label: "Débito (conta)", color: "bg-red-500" },
]

export interface MonthlyPoint {
  label: string
  installments: number
  subscriptions: number
  oneOff: number
  debit: number
}

function yearMonth(date: string): [number, number] {
  const [y, m] = date.split("-").map(Number)
  return [y || 0, m || 0]
}

function isActiveIn(firstDate: string, total: number, year: number, monthIndex0: number): boolean {
  const [fy, fm] = yearMonth(firstDate)
  if (!fy || !fm) return false
  const elapsed = (year - fy) * 12 + (monthIndex0 + 1 - fm)
  return elapsed >= 0 && elapsed < total
}

export function computeYearProjection(
  cards: CardOverview[],
  accounts: Account[],
  year: number
): MonthlyPoint[] {
  const subscriptionMonthly = cards.reduce(
    (sum, card) => sum + card.subscriptions.reduce((s, sub) => s + sub.monthlyAmount, 0),
    0
  )

  return MONTH_LABELS.map((label, monthIndex0) => {
    let installments = 0
    let oneOff = 0
    let debit = 0
    for (const card of cards) {
      for (const p of card.installmentPurchases) {
        if (p.totalInstallments > 1) {
          if (isActiveIn(p.firstInstallmentDate, p.totalInstallments, year, monthIndex0)) {
            installments += p.installmentAmount
          }
        } else {
          const [fy, fm] = yearMonth(p.firstInstallmentDate)
          if (fy === year && fm === monthIndex0 + 1) oneOff += p.installmentAmount
        }
      }
    }
    for (const account of accounts) {
      for (const purchase of account.purchases) {
        const [py, pm] = yearMonth(purchase.date)
        if (py === year && pm === monthIndex0 + 1) debit += purchase.amount
      }
    }
    return { label, installments, subscriptions: subscriptionMonthly, oneOff, debit }
  })
}

export interface Breakdown {
  installments: number
  subscriptions: number
  oneOff: number
  debit: number
  total: number
}

export function breakdownForMonth(projection: MonthlyPoint[], monthIndex0: number): Breakdown {
  const point = projection[monthIndex0] ?? { installments: 0, subscriptions: 0, oneOff: 0, debit: 0 }
  const total = point.installments + point.subscriptions + point.oneOff + point.debit
  return {
    installments: point.installments,
    subscriptions: point.subscriptions,
    oneOff: point.oneOff,
    debit: point.debit,
    total,
  }
}

export function yearTotal(projection: MonthlyPoint[]): number {
  return projection.reduce((sum, p) => sum + p.installments + p.subscriptions + p.oneOff + p.debit, 0)
}
