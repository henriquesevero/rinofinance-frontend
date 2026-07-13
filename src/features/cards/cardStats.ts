import type { CardOverview, InstallmentPurchase } from "./types"

// Whether an installment purchase bills a charge in the current month —
// mirrors the backend's IsActiveOn (started and not yet paid off). Parsed
// from the YYYY-MM-DD string directly to avoid timezone drift.
function isActiveThisMonth(p: Pick<InstallmentPurchase, "firstInstallmentDate" | "totalInstallments">): boolean {
  const [year, month] = p.firstInstallmentDate.split("-").map(Number)
  if (!year || !month) return false
  const now = new Date()
  const elapsed = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
  return elapsed >= 0 && elapsed < p.totalInstallments
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
  // Fraction of the credit limit used by this month's bill (0–1+), or
  // null when no limit is configured.
  limitUsedFraction: number | null
  // Days until the next invoice due date, or null when no due day is set.
  daysUntilDue: number | null
}

export function computeCardStats(card: CardOverview): CardStats {
  let installmentMonthly = 0
  let oneOffMonthly = 0
  let flaggedCount = 0
  let endingThisMonthCount = 0

  for (const p of card.installmentPurchases) {
    if (p.flagged) flaggedCount++
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

  const subscriptionMonthly = card.subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0)

  return {
    installmentMonthly,
    oneOffMonthly,
    subscriptionMonthly,
    flaggedCount,
    endingThisMonthCount,
    subscriptionCount: card.subscriptions.length,
    limitUsedFraction: card.creditLimit > 0 ? card.monthlyTotal / card.creditLimit : null,
    daysUntilDue: daysUntilDue(card.dueDay),
  }
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
