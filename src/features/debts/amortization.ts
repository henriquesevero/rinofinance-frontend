import type { Debt } from "./types"

export type InstallmentStatus = "paid" | "anticipated" | "overdue" | "open"

export interface Installment {
  number: number
  dueDate: string
  amount: number
  status: InstallmentStatus
  daysUntilDue: number
  presentValue: number
  paidAmount?: number
  paidAt?: string
}

const DAY_MS = 86_400_000
const pad = (n: number) => String(n).padStart(2, "0")

function toUtc(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return Date.UTC(y, m - 1, d)
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS)
}

export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate()
  return new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay))).toISOString().slice(0, 10)
}

export function impliedMonthlyRate(financed: number, installment: number, count: number): number {
  if (financed <= 0 || installment <= 0 || count < 1 || installment * count <= financed) return 0
  let low = 0
  let high = 1
  for (let i = 0; i < 100; i++) {
    const rate = (low + high) / 2
    const pv = (installment * (1 - (1 + rate) ** -count)) / rate
    if (pv > financed) low = rate
    else high = rate
  }
  return (low + high) / 2
}

export function contractRate(debt: Debt): number {
  if (debt.monthlyRate > 0) return debt.monthlyRate / 100
  return impliedMonthlyRate(debt.financedAmount, debt.installmentAmount, debt.totalInstallments)
}

export function annualRate(monthly: number): number {
  return (1 + monthly) ** 12 - 1
}

// CDC anticipation is priced as compound present value at the contract rate, on a 30-day month.
export function presentValue(amount: number, rate: number, days: number): number {
  return days <= 0 ? amount : amount / (1 + rate) ** (days / 30)
}

export function buildSchedule(debt: Debt, rate: number, today: string): Installment[] {
  const payments = new Map(debt.payments.map((p) => [p.number, p]))
  const firstDue = debt.firstDueDate.slice(0, 10)
  return Array.from({ length: debt.totalInstallments }, (_, i) => {
    const number = i + 1
    const dueDate = addMonths(firstDue, i)
    const daysUntilDue = daysBetween(today, dueDate)
    const amount = debt.installmentAmount
    const payment = payments.get(number)
    if (payment) {
      return {
        number,
        dueDate,
        amount,
        daysUntilDue,
        presentValue: 0,
        status: payment.kind === "antecipada" ? "anticipated" : "paid",
        paidAmount: payment.amount,
        paidAt: payment.paidAt.slice(0, 10),
      }
    }
    return {
      number,
      dueDate,
      amount,
      daysUntilDue,
      presentValue: presentValue(amount, rate, daysUntilDue),
      status: daysUntilDue < 0 ? "overdue" : "open",
    }
  })
}

const sum = <T,>(items: T[], pick: (item: T) => number) => items.reduce((total, item) => total + pick(item), 0)

export interface DebtSummary {
  pending: Installment[]
  open: Installment[]
  overdue: Installment[]
  paidCount: number
  anticipatedCount: number
  remainingNominal: number
  payoffToday: number
  payoffSaving: number
  realizedSaving: number
  totalPaid: number
  contractTotal: number
  contractInterest: number
  lastDueDate: string | null
}

export function summarize(debt: Debt, schedule: Installment[]): DebtSummary {
  const pending = schedule.filter((i) => i.status === "open" || i.status === "overdue")
  const anticipated = schedule.filter((i) => i.status === "anticipated")
  const remainingNominal = sum(pending, (i) => i.amount)
  const payoffToday = sum(pending, (i) => i.presentValue)
  const contractTotal = debt.installmentAmount * debt.totalInstallments
  return {
    pending,
    open: pending.filter((i) => i.status === "open"),
    overdue: pending.filter((i) => i.status === "overdue"),
    paidCount: schedule.filter((i) => i.status === "paid").length,
    anticipatedCount: anticipated.length,
    remainingNominal,
    payoffToday,
    payoffSaving: remainingNominal - payoffToday,
    realizedSaving: sum(anticipated, (i) => i.amount - (i.paidAmount ?? i.amount)),
    totalPaid: sum(schedule, (i) => i.paidAmount ?? 0),
    contractTotal,
    contractInterest: Math.max(0, contractTotal - debt.financedAmount),
    lastDueDate: pending.at(-1)?.dueDate ?? null,
  }
}

export interface AnticipationResult {
  items: Installment[]
  cost: number
  nominal: number
  saving: number
  leftover: number
  newEndDate: string | null
  nextInstallmentsSaving: number
  investmentGain: number
  remainingByStep: number[]
}

export const anticipable = (open: Installment[]) => open.filter((i) => i.daysUntilDue > 0)

export function costOfLast(open: Installment[], count: number): number {
  return count > 0 ? sum(anticipable(open).slice(-count), (i) => i.presentValue) : 0
}

// The last installments are the farthest from today, so each real spent on them buys the largest discount.
export function simulateLump(
  open: Installment[],
  budget: number,
  rate: number,
  yieldRate: number
): AnticipationResult {
  const candidates = anticipable(open)
  const items: Installment[] = []
  let cost = 0
  for (let i = candidates.length - 1; i >= 0; i--) {
    if (cost + candidates[i].presentValue > budget + 0.005) break
    cost += candidates[i].presentValue
    items.unshift(candidates[i])
  }
  const taken = new Set(items.map((i) => i.number))
  const kept = open.filter((i) => !taken.has(i.number))
  const nominal = sum(items, (i) => i.amount)
  const nextItems = candidates.slice(0, items.length)
  return {
    items,
    cost,
    nominal,
    saving: nominal - cost,
    leftover: Math.max(0, budget - cost),
    newEndDate: kept.at(-1)?.dueDate ?? null,
    nextInstallmentsSaving: sum(nextItems, (i) => i.amount - presentValue(i.amount, rate, i.daysUntilDue)),
    investmentGain: sum(items, (i) => i.presentValue * ((1 + yieldRate) ** (i.daysUntilDue / 30) - 1)),
    remainingByStep: [
      sum(kept, (i) => i.amount),
      ...open.map((step) => sum(kept, (i) => (i.dueDate > step.dueDate ? i.amount : 0))),
    ],
  }
}

export interface MonthlyPlanResult {
  totalPaid: number
  nominal: number
  saving: number
  endDate: string | null
  monthsSaved: number
  stepsToFinish: number
  remainingByStep: number[]
}

export function simulateMonthlyPlan(open: Installment[], extra: number, rate: number): MonthlyPlanResult {
  const queue = [...open]
  const nominal = sum(open, (i) => i.amount)
  const remainingByStep = [nominal]
  let cash = 0
  let totalPaid = 0
  let endDate: string | null = null
  let steps = 0

  while (queue.length > 0) {
    const current = queue.shift()!
    const date = current.dueDate
    totalPaid += current.amount
    cash += extra
    while (queue.length > 0) {
      const last = queue[queue.length - 1]
      const price = presentValue(last.amount, rate, daysBetween(date, last.dueDate))
      if (price > cash) break
      cash -= price
      totalPaid += price
      queue.pop()
    }
    steps += 1
    endDate = date
    remainingByStep.push(sum(queue, (i) => i.amount))
  }
  while (remainingByStep.length < open.length + 1) remainingByStep.push(0)

  return {
    totalPaid,
    nominal,
    saving: nominal - totalPaid,
    endDate,
    monthsSaved: open.length - steps,
    stepsToFinish: steps,
    remainingByStep,
  }
}

export interface PayoffScenario {
  monthsAhead: number
  date: string
  regularUntilThen: number
  settlement: number
  total: number
  extraVersusToday: number
}

export function payoffScenarios(pending: Installment[], rate: number, today: string): PayoffScenario[] {
  const horizons = [0, 3, 6, 12, 24].filter((m) => m === 0 || addMonths(today, m) < (pending.at(-1)?.dueDate ?? ""))
  const costAt = (monthsAhead: number): PayoffScenario => {
    const date = addMonths(today, monthsAhead)
    let regularUntilThen = 0
    let settlement = 0
    for (const item of pending) {
      if (item.dueDate <= date) regularUntilThen += item.amount
      else settlement += presentValue(item.amount, rate, daysBetween(date, item.dueDate))
    }
    return { monthsAhead, date, regularUntilThen, settlement, total: regularUntilThen + settlement, extraVersusToday: 0 }
  }
  const scenarios = horizons.map(costAt)
  return scenarios.map((s) => ({ ...s, extraVersusToday: s.total - scenarios[0].total }))
}

// Scales the per-installment estimates to the amount the bank actually charged, keeping cents exact.
export function allocatePaidAmount(items: Installment[], total: number): { number: number; amount: number }[] {
  const estimate = sum(items, (i) => i.presentValue)
  let allocated = 0
  return items.map((item, index) => {
    const amount =
      index === items.length - 1
        ? Math.round((total - allocated) * 100) / 100
        : Math.round(((item.presentValue / estimate) * total) * 100) / 100
    allocated += amount
    return { number: item.number, amount }
  })
}

export function durationLabel(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts = []
  if (years > 0) parts.push(`${years} ${years === 1 ? "ano" : "anos"}`)
  if (rest > 0 || years === 0) parts.push(`${rest} ${rest === 1 ? "mês" : "meses"}`)
  return parts.join(" e ")
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function monthYear(iso: string): string {
  return `${MONTHS[Number(iso.slice(5, 7)) - 1]}/${iso.slice(0, 4)}`
}

export function shortDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

export function formatPct(fraction: number, digits = 2): string {
  return `${(fraction * 100).toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`
}
