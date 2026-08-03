import type { CardOverview, InstallmentPurchase, Subscription } from "./types"

function monthIndexFromKey(key: string): number {
  const [y, m] = key.split("-").map(Number)
  return (y || 0) * 12 + ((m || 1) - 1)
}
function firstMonthIndex(firstDate: string): number | null {
  const [y, m] = firstDate.split("-").map(Number)
  if (!y || !m) return null
  return y * 12 + (m - 1)
}
function canceledBy(canceledFrom: string | undefined, refIndex: number): boolean {
  return !!canceledFrom && monthIndexFromKey(canceledFrom) <= refIndex
}
function startedBy(effectiveFrom: string | undefined, refIndex: number): boolean {
  return !effectiveFrom || monthIndexFromKey(effectiveFrom) <= refIndex
}

export function isPurchaseActiveInMonth(
  p: Pick<InstallmentPurchase, "firstInstallmentDate" | "totalInstallments" | "canceledFrom" | "effectiveFrom">,
  monthKey: string
): boolean {
  const first = firstMonthIndex(p.firstInstallmentDate)
  if (first === null) return false
  const refIndex = monthIndexFromKey(monthKey)
  if (canceledBy(p.canceledFrom, refIndex) || !startedBy(p.effectiveFrom, refIndex)) return false
  const elapsed = refIndex - first
  return elapsed >= 0 && elapsed < p.totalInstallments
}

export function isSubscriptionActiveInMonth(
  s: Pick<Subscription, "canceledFrom" | "effectiveFrom">,
  monthKey: string
): boolean {
  const refIndex = monthIndexFromKey(monthKey)
  return startedBy(s.effectiveFrom, refIndex) && !canceledBy(s.canceledFrom, refIndex)
}

function installmentsOwed(
  p: Pick<InstallmentPurchase, "firstInstallmentDate" | "totalInstallments" | "canceledFrom">,
  refIndex: number,
  includeCurrent: boolean
): number {
  if (canceledBy(p.canceledFrom, refIndex)) return 0
  const first = firstMonthIndex(p.firstInstallmentDate)
  if (first === null) return 0
  const elapsed = refIndex - first
  let remaining = p.totalInstallments - elapsed - (includeCurrent ? 0 : 1)
  if (remaining > p.totalInstallments) remaining = p.totalInstallments
  if (remaining < 0) remaining = 0
  if (p.canceledFrom) {
    const cap = monthIndexFromKey(p.canceledFrom) - refIndex - (includeCurrent ? 0 : 1)
    if (cap < remaining) remaining = Math.max(0, cap)
  }
  return remaining
}

export interface CardStats {
  installmentMonthly: number
  oneOffMonthly: number
  subscriptionMonthly: number
  flaggedCount: number
  endingThisMonthCount: number
  subscriptionCount: number
  totalOwed: number
  totalOwedWithCurrent: number
  limitUsedFraction: number | null
  limitOwedFraction: number | null
  daysUntilDue: number | null
  bestPurchaseDay: number | null
  daysUntilClose: number | null
}

export function computeCardStats(card: CardOverview, referenceMonth: string): CardStats {
  const refIndex = monthIndexFromKey(referenceMonth)
  let installmentMonthly = 0
  let oneOffMonthly = 0
  let flaggedCount = 0
  let endingThisMonthCount = 0
  let totalOwed = 0
  let totalOwedWithCurrent = 0

  for (const p of card.installmentPurchases) {
    const first = firstMonthIndex(p.firstInstallmentDate)
    if (first === null || canceledBy(p.canceledFrom, refIndex) || !startedBy(p.effectiveFrom, refIndex)) continue
    const elapsed = refIndex - first
    if (elapsed < 0 || elapsed >= p.totalInstallments) continue

    if (p.flagged) flaggedCount++
    if (p.totalInstallments > 1 && !p.excludedFromOwed) {
      totalOwed += installmentsOwed(p, refIndex, false) * p.installmentAmount
      totalOwedWithCurrent += installmentsOwed(p, refIndex, true) * p.installmentAmount
    }
    if (p.totalInstallments > 1) {
      installmentMonthly += p.installmentAmount
      if (elapsed === p.totalInstallments - 1) endingThisMonthCount++
    } else {
      oneOffMonthly += p.installmentAmount
    }
  }

  const subscriptionMonthly = card.subscriptions.reduce(
    (sum, s) =>
      startedBy(s.effectiveFrom, refIndex) && !canceledBy(s.canceledFrom, refIndex) ? sum + s.monthlyAmount : sum,
    0
  )

  return {
    installmentMonthly,
    oneOffMonthly,
    subscriptionMonthly,
    flaggedCount,
    endingThisMonthCount,
    subscriptionCount: card.subscriptions.length,
    totalOwed,
    totalOwedWithCurrent,
    limitUsedFraction: card.creditLimit > 0 ? card.monthlyTotal / card.creditLimit : null,
    limitOwedFraction: card.creditLimit > 0 ? totalOwed / card.creditLimit : null,
    daysUntilDue: daysUntilDue(card.dueDay),
    bestPurchaseDay: bestPurchaseDay(card.closingDay),
    daysUntilClose: daysUntilDue(card.closingDay),
  }
}

export function bestPurchaseDay(closingDay?: number): number | null {
  if (!closingDay || closingDay < 1 || closingDay > 31) return null
  return closingDay >= 31 ? 1 : closingDay + 1
}

export function daysUntilDue(dueDay?: number): number | null {
  if (!dueDay || dueDay < 1 || dueDay > 31) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const makeDue = (year: number, month: number) => {
    const lastDay = new Date(year, month + 1, 0).getDate()
    return new Date(year, month, Math.min(dueDay, lastDay))
  }

  let due = makeDue(now.getFullYear(), now.getMonth())
  if (due < now) {
    const nextMonth = now.getMonth() + 1
    due = makeDue(now.getFullYear() + Math.floor(nextMonth / 12), nextMonth % 12)
  }
  return Math.round((due.getTime() - now.getTime()) / 86_400_000)
}
