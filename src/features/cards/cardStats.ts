import type { CardOverview, InstallmentPurchase, Subscription } from "./types"

// Collapse a Date to a comparable 0-based month ordinal (year*12 + month).
function monthIndexFromDate(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth()
}
// Same, from a "YYYY-MM" or "YYYY-MM-DD" string.
function monthIndexFromKey(key: string): number {
  const [y, m] = key.split("-").map(Number)
  return (y || 0) * 12 + ((m || 1) - 1)
}
// Whether an item ended via `canceledFrom` no longer bills in the reference
// month ordinal (i.e. the reference is at or after its cancellation month).
function canceledBy(canceledFrom: string | undefined, refIndex: number): boolean {
  return !!canceledFrom && monthIndexFromKey(canceledFrom) <= refIndex
}

// Whether an installment purchase bills a charge in the current month —
// mirrors the backend's IsActiveOn (started, not paid off, not canceled).
// Parsed from the YYYY-MM-DD string directly to avoid timezone drift.
function isActiveThisMonth(
  p: Pick<InstallmentPurchase, "firstInstallmentDate" | "totalInstallments" | "canceledFrom">
): boolean {
  const [year, month] = p.firstInstallmentDate.split("-").map(Number)
  if (!year || !month) return false
  const now = new Date()
  if (canceledBy(p.canceledFrom, monthIndexFromDate(now))) return false
  const elapsed = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
  return elapsed >= 0 && elapsed < p.totalInstallments
}

// Whether an installment purchase is active (billing) in a specific month,
// given as "YYYY-MM" — used to scope the card's lists to the viewed month so
// canceled/ended items vanish from the current fatura but stay in the past.
export function isPurchaseActiveInMonth(
  p: Pick<InstallmentPurchase, "firstInstallmentDate" | "totalInstallments" | "canceledFrom">,
  monthKey: string
): boolean {
  const [year, month] = p.firstInstallmentDate.split("-").map(Number)
  if (!year || !month) return false
  const refIndex = monthIndexFromKey(monthKey)
  if (canceledBy(p.canceledFrom, refIndex)) return false
  const elapsed = refIndex - (year * 12 + (month - 1))
  return elapsed >= 0 && elapsed < p.totalInstallments
}

// Whether a subscription bills in a given month "YYYY-MM": always, unless it
// was ended before it (no start bound — mirrors the backend).
export function isSubscriptionActiveInMonth(
  s: Pick<Subscription, "canceledFrom">,
  monthKey: string
): boolean {
  return !canceledBy(s.canceledFrom, monthIndexFromKey(monthKey))
}

// Installments left to pay as of TODAY, for the "quitação" total — i.e. the
// future installments only, NOT counting the one already on this month's
// bill. A purchase at 7/12 has 5 left to pay (8→12). Computed from today so
// it stays fixed regardless of which month the user is browsing (the API's
// remainingTotal is relative to the requested month and would balloon on a
// past month).
function installmentsLeftToPay(
  p: Pick<InstallmentPurchase, "firstInstallmentDate" | "totalInstallments" | "canceledFrom">
): number {
  const [year, month] = p.firstInstallmentDate.split("-").map(Number)
  if (!year || !month) return 0
  const now = new Date()
  if (canceledBy(p.canceledFrom, monthIndexFromDate(now))) return 0
  const elapsed = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
  // How many installments have been billed so far, including the current
  // month's (clamped to the plan's bounds).
  const billed = Math.max(0, Math.min(elapsed + 1, p.totalInstallments))
  return p.totalInstallments - billed
}

// Installments still owed as of TODAY *including* the current month's — i.e.
// the parcela being billed now still counts. A purchase at 2/3 has 2 left
// (the current 2nd + the future 3rd). Used for the alternative "total que
// devo" that includes the month's installment.
function installmentsRemainingWithCurrent(
  p: Pick<InstallmentPurchase, "firstInstallmentDate" | "totalInstallments" | "canceledFrom">
): number {
  const [year, month] = p.firstInstallmentDate.split("-").map(Number)
  if (!year || !month) return 0
  const now = new Date()
  if (canceledBy(p.canceledFrom, monthIndexFromDate(now))) return 0
  const elapsed = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
  // Installments fully paid *before* the current month.
  const paid = Math.max(0, Math.min(elapsed, p.totalInstallments))
  return p.totalInstallments - paid
}

export interface CardStats {
  // Monthly spending split into the three groups, summing to ~monthlyTotal.
  installmentMonthly: number
  oneOffMonthly: number
  subscriptionMonthly: number
  flaggedCount: number
  // Purchases whose last installment falls in the current month.
  endingThisMonthCount: number
  subscriptionCount: number
  // Total still owed on the card: the sum of every purchase's remaining
  // installments × installment amount (subscriptions have no fixed end, so
  // they don't count toward a "total debt"). Excludes the current month's
  // installment (the "quitação" of what's left after this bill).
  totalOwed: number
  // Same, but *including* the current month's installment — what you'd still
  // pay counting the parcela being billed now.
  totalOwedWithCurrent: number
  // Fraction of the credit limit used by this month's bill (0–1+), or
  // null when no limit is configured.
  limitUsedFraction: number | null
  // Fraction of the credit limit committed by everything still owed
  // (totalOwed / limit), or null when no limit is configured.
  limitOwedFraction: number | null
  // Days until the next invoice due date, or null when no due day is set.
  daysUntilDue: number | null
  // Best day to make a new purchase (the day after the bill closes, giving
  // the longest interest-free window), or null when no closing day is set.
  bestPurchaseDay: number | null
  // Days until the current bill closes, or null when no closing day is set.
  daysUntilClose: number | null
}

export function computeCardStats(card: CardOverview): CardStats {
  let installmentMonthly = 0
  let oneOffMonthly = 0
  let flaggedCount = 0
  let endingThisMonthCount = 0
  let totalOwed = 0
  let totalOwedWithCurrent = 0

  for (const p of card.installmentPurchases) {
    if (p.flagged) flaggedCount++
    // The user can exclude specific purchases from the "total que devo" sum.
    if (!p.excludedFromOwed) {
      totalOwed += installmentsLeftToPay(p) * p.installmentAmount
      totalOwedWithCurrent += installmentsRemainingWithCurrent(p) * p.installmentAmount
    }
    if (!isActiveThisMonth(p)) continue
    if (p.totalInstallments > 1) {
      installmentMonthly += p.installmentAmount
      // Only real installment plans "end" — a 1x avulsa isn't a parcela
      // finishing, and subscriptions don't count here at all.
      if (p.remainingInstallments === 1) endingThisMonthCount++
    } else {
      oneOffMonthly += p.installmentAmount
    }
  }

  const nowIndex = monthIndexFromDate(new Date())
  const subscriptionMonthly = card.subscriptions.reduce(
    (sum, s) => (canceledBy(s.canceledFrom, nowIndex) ? sum : sum + s.monthlyAmount),
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
