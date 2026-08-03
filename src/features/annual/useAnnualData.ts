import { useEffect, useMemo, useState } from "react"
import { dashboardApi } from "@/features/dashboard/api"
import type { AnnualSummary } from "@/features/dashboard/types"
import { toErrorMessage } from "@/lib/errors"

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export interface AnnualMonth {
  index: number // 0-based
  label: string
  income: number // entradas do mês (recebidas ou previstas, conforme o modo)
  expense: number // saídas do mês (pagas ou previstas, conforme o modo)
  net: number
}

export interface AnnualData {
  months: AnnualMonth[]
  totalIncome: number
  totalExpense: number
  net: number
  // Best/worst by net among months that had any activity.
  bestMonth: AnnualMonth | null
  worstMonth: AnnualMonth | null
  activeMonths: number
  avgIncome: number
  avgExpense: number
  avgNet: number
  savingsRate: number | null
  // Realized totals by category across the year, most first.
  expenseCategoryTotals: { id: string; total: number }[]
  incomeCategoryTotals: { id: string; total: number }[]
}

// The two lenses on the year: "realized" counts only what was actually
// received/paid each month (varies month to month); "planned" counts every
// active item regardless of its paid/received flag (so categorized entries
// always show, even when not yet marked off).
export type AnnualMode = "realized" | "planned"

// Cache the raw yearly payload so revisiting a year — or toggling the mode,
// which is a pure client-side reshape — never re-hits the API.
const yearCache = new Map<number, AnnualSummary>()

// Reshapes the server's precomputed yearly payload into the view model for the
// selected mode. No network — both modes come from the same response.
function aggregate(raw: AnnualSummary, mode: AnnualMode): AnnualData {
  const planned = mode === "planned"

  const months: AnnualMonth[] = raw.months.map((m) => {
    const income = planned ? m.incomePlanned : m.incomeRealized
    const expense = planned ? m.expensePlanned : m.expenseRealized
    return { index: m.index, label: MONTH_LABELS[m.index], income, expense, net: income - expense }
  })

  const totalIncome = months.reduce((s, m) => s + m.income, 0)
  const totalExpense = months.reduce((s, m) => s + m.expense, 0)
  const active = months.filter((m) => m.income > 0 || m.expense > 0)
  const activeMonths = active.length

  return {
    months,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    bestMonth: active.length ? active.reduce((a, b) => (b.net > a.net ? b : a)) : null,
    worstMonth: active.length ? active.reduce((a, b) => (b.net < a.net ? b : a)) : null,
    activeMonths,
    avgIncome: activeMonths ? totalIncome / activeMonths : 0,
    avgExpense: activeMonths ? totalExpense / activeMonths : 0,
    avgNet: activeMonths ? (totalIncome - totalExpense) / activeMonths : 0,
    savingsRate: totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : null,
    expenseCategoryTotals: planned ? raw.expenseCategoriesPlanned : raw.expenseCategoriesRealized,
    incomeCategoryTotals: planned ? raw.incomeCategoriesPlanned : raw.incomeCategoriesRealized,
  }
}

// Fetches the whole year in a single request (the backend computes all 12
// months in one pass) and aggregates it for the chosen mode. The fetch depends
// only on the year; switching mode reshapes the cached payload instantly.
export function useAnnualData(year: number, mode: AnnualMode) {
  const [raw, setRaw] = useState<AnnualSummary | null>(() => yearCache.get(year) ?? null)
  const [isLoading, setIsLoading] = useState(() => !yearCache.has(year))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Stale-while-revalidate: show the cached year instantly (no spinner, no
    // 12-request wait), then refresh it in the background so edits made on
    // other screens still land. Only the year drives this — switching mode
    // reshapes the cached payload without any request.
    const cached = yearCache.get(year)
    setRaw(cached ?? null)
    setIsLoading(!cached)
    setError(null)

    let cancelled = false
    dashboardApi
      .getAnnual(year)
      .then((res) => {
        if (cancelled) return
        yearCache.set(year, res)
        setRaw(res)
      })
      .catch((err) => {
        // Keep showing the cached data if we have it; only surface an error
        // when there's nothing to fall back on.
        if (!cancelled && !yearCache.has(year)) setError(toErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [year])

  const data = useMemo(() => (raw ? aggregate(raw, mode) : null), [raw, mode])

  return { data, isLoading, error }
}
