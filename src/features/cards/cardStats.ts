import type { CardOverview, InstallmentPurchase, Subscription } from "./types"

// A comparable 0-based month ordinal (year*12 + monthIndex) from a "YYYY-MM"
// or "YYYY-MM-DD" string. Everything below compares purchases by month ordinal
// so nothing depends on the day or the timezone.
function monthIndexFromKey(key: string): number {
  const [y, m] = key.split("-").map(Number)
  return (y || 0) * 12 + ((m || 1) - 1)
}
function firstMonthIndex(firstDate: string): number | null {
  const [y, m] = firstDate.split("-").map(Number)
  if (!y || !m) return null
  return y * 12 + (m - 1)
}
// Whether an item ended via `canceledFrom` no longer bills at/after refIndex.
function canceledBy(canceledFrom: string | undefined, refIndex: number): boolean {
  return !!canceledFrom && monthIndexFromKey(canceledFrom) <= refIndex
}
// Whether an item's `effectiveFrom` lower bound (visible-from month) has been
// reached at refIndex — so it doesn't appear retroactively before an import.
function startedBy(effectiveFrom: string | undefined, refIndex: number): boolean {
  return !effectiveFrom || monthIndexFromKey(effectiveFrom) <= refIndex
}

// Whether an installment purchase bills a charge in the given month "YYYY-MM":
// it has started, isn't paid off, and isn't canceled by then. Used to scope
// the card's lists to the viewed month.
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

// Whether a subscription bills in a given month "YYYY-MM": from its
// effective-from month (if any) until it's canceled.
export function isSubscriptionActiveInMonth(
  s: Pick<Subscription, "canceledFrom" | "effectiveFrom">,
  monthKey: string
): boolean {
  const refIndex = monthIndexFromKey(monthKey)
  return startedBy(s.effectiveFrom, refIndex) && !canceledBy(s.canceledFrom, refIndex)
}

// How many installments are still owed as of the reference month.
//   includeCurrent = true  → the reference month's parcela AND every future one
//                            ("com atual").
//   includeCurrent = false → future parcelas only, excluding the reference
//                            month's ("sem atual" / quitação).
// A purchase at parcela 2/3 (viewed in its 2nd month) owes 2 with current and
// 1 without. Capped by an early cancellation.
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
  // An early cancellation stops billing at `canceledFrom`: only the months
  // from the reference up to (but excluding) that month still count.
  if (p.canceledFrom) {
    const cap = monthIndexFromKey(p.canceledFrom) - refIndex - (includeCurrent ? 0 : 1)
    if (cap < remaining) remaining = Math.max(0, cap)
  }
  return remaining
}

export interface CardStats {
  // Monthly spending split into the three groups, summing to ~monthlyTotal.
  installmentMonthly: number
  oneOffMonthly: number
  subscriptionMonthly: number
  flaggedCount: number
  // Purchases whose last installment falls in the reference month.
  endingThisMonthCount: number
  subscriptionCount: number
  // Total still owed on installment plans (parceladas) only — one-off (1x)
  // purchases don't count. `totalOwed` excludes the reference month's parcela
  // (quitação after this bill); `totalOwedWithCurrent` includes it.
  totalOwed: number
  totalOwedWithCurrent: number
  // Fraction of the credit limit used by this month's bill / owed overall.
  limitUsedFraction: number | null
  limitOwedFraction: number | null
  // Date-based countdowns, always relative to today (not the reference month).
  daysUntilDue: number | null
  bestPurchaseDay: number | null
  daysUntilClose: number | null
}

// Computes a card's stats relative to `referenceMonth` ("YYYY-MM") — the month
// the user is viewing — so the owed totals, the monthly composition and the
// per-month list all agree. The day-based countdowns stay relative to today.
export function computeCardStats(card: CardOverview, referenceMonth: string): CardStats {
  const refIndex = monthIndexFromKey(referenceMonth)
  let installmentMonthly = 0
  let oneOffMonthly = 0
  let flaggedCount = 0
  let endingThisMonthCount = 0
  let totalOwed = 0
  let totalOwedWithCurrent = 0

  for (const p of card.installmentPurchases) {
    // Only purchases actually on the viewed month's bill count — the same set
    // shown in the list. This is what makes "total que devo" match the fatura:
    // finished purchases (past) and not-yet-started ones (future) are ignored,
    // so leftover/other-month items never inflate the total.
    const first = firstMonthIndex(p.firstInstallmentDate)
    if (first === null || canceledBy(p.canceledFrom, refIndex) || !startedBy(p.effectiveFrom, refIndex)) continue
    const elapsed = refIndex - first
    if (elapsed < 0 || elapsed >= p.totalInstallments) continue

    if (p.flagged) flaggedCount++
    // "Total que devo" is the debt carried in installment plans only — one-off
    // (1x) purchases are a single charge on this month's bill, not carried
    // debt, so they never count. The user can also exclude specific ones.
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

// The best day to make a new purchase is the day right after the invoice
// closes: the charge lands on the next bill, maximizing the interest-free
// period. Returns a day of month (1–31), wrapping past month-end to day 1.
export function bestPurchaseDay(closingDay?: number): number | null {
  if (!closingDay || closingDay < 1 || closingDay > 31) return null
  return closingDay >= 31 ? 1 : closingDay + 1
}

// Days from today until the next occurrence of the invoice due day,
// clamping the day to the target month's length (e.g. day 31 in Feb).
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
