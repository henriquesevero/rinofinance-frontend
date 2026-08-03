import { useEffect, useMemo, useState } from "react"
import { dashboardApi } from "@/features/dashboard/api"
import type { AnnualSummary } from "@/features/dashboard/types"
import { toErrorMessage } from "@/lib/errors"

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export interface AnnualMonth {
  index: number
  label: string
  income: number
  expense: number
  net: number
}

export interface AnnualData {
  months: AnnualMonth[]
  totalIncome: number
  totalExpense: number
  net: number
  bestMonth: AnnualMonth | null
  worstMonth: AnnualMonth | null
  activeMonths: number
  avgIncome: number
  avgExpense: number
  avgNet: number
  savingsRate: number | null
  expenseCategoryTotals: { id: string; total: number }[]
  incomeCategoryTotals: { id: string; total: number }[]
}

export type AnnualMode = "realized" | "planned"

const yearCache = new Map<number, AnnualSummary>()

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

export function useAnnualData(year: number, mode: AnnualMode) {
  const [raw, setRaw] = useState<AnnualSummary | null>(() => yearCache.get(year) ?? null)
  const [isLoading, setIsLoading] = useState(() => !yearCache.has(year))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
