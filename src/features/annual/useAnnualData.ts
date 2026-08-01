import { useEffect, useState } from "react"
import { dashboardApi } from "@/features/dashboard/api"
import { toErrorMessage } from "@/lib/errors"

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export interface AnnualMonth {
  index: number // 0-based
  label: string
  income: number // entradas recebidas no mês
  expense: number // saídas pagas no mês
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
  // Realized spending by category across the year, most first.
  categoryTotals: { id: string; total: number }[]
}

// Fetches the 12 monthly summaries of a year in parallel and aggregates the
// *realized* cash flow — income actually received and expenses actually paid
// each month — since the planned (recurring) totals are identical every month
// and would flatline. Recomputes whenever the year changes.
export function useAnnualData(year: number) {
  const [data, setData] = useState<AnnualData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    Promise.all(
      Array.from({ length: 12 }, (_, i) => dashboardApi.getSummary(`${year}-${String(i + 1).padStart(2, "0")}`))
    )
      .then((summaries) => {
        if (cancelled) return

        const months: AnnualMonth[] = summaries.map((s, i) => {
          const income = s.incomes.reduce((sum, inc) => (inc.active && inc.received ? sum + inc.amount : sum), 0)
          const expense = s.expenses.reduce((sum, e) => (e.active && e.paid ? sum + e.amount : sum), 0)
          return { index: i, label: MONTH_LABELS[i], income, expense, net: income - expense }
        })

        const totalIncome = months.reduce((s, m) => s + m.income, 0)
        const totalExpense = months.reduce((s, m) => s + m.expense, 0)
        const active = months.filter((m) => m.income > 0 || m.expense > 0)
        const activeMonths = active.length

        const catMap = new Map<string, number>()
        for (const s of summaries) {
          for (const e of s.expenses) {
            if (!e.active || !e.paid) continue
            const key = e.categoryId || "__none__"
            catMap.set(key, (catMap.get(key) ?? 0) + e.amount)
          }
        }

        setData({
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
          categoryTotals: [...catMap.entries()]
            .map(([id, total]) => ({ id, total }))
            .sort((a, b) => b.total - a.total),
        })
      })
      .catch((err) => {
        if (!cancelled) setError(toErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [year])

  return { data, isLoading, error }
}
