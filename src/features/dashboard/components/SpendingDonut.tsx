import { useEffect, useMemo, useState } from "react"
import { PieChart, TrendingDown, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { CategoryIcon } from "@/features/categories/categoryIcons"
import { useCategoriesStore } from "@/features/categories/store"
import { cn } from "@/lib/utils"
import type { CategorySlice } from "../categorySpending"
import { monthKey, previousTotals, recordSnapshot, trendFor } from "../spendingHistory"
import type { Expense, Income } from "../types"

interface SpendingDonutProps {
  expenses: Expense[]
  incomes: Income[]
}

const UNCATEGORIZED = { id: "__none__", name: "Sem categoria", color: "#9CA3AF" }

// "Distribuição dos gastos": a donut of the month's spending split by category
// with a ranked list (share, value, and a real month-over-month trend arrow).
// The Gastos/Entradas toggle flips it to income by category.
export function SpendingDonut({ expenses, incomes }: SpendingDonutProps) {
  const categories = useCategoriesStore((s) => s.categories)
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories)
  const [mode, setMode] = useState<"gastos" | "entradas">("gastos")

  useEffect(() => {
    if (categories.length === 0) fetchCategories()
  }, [categories.length, fetchCategories])

  // The spending distribution comes straight from the expenses ("saídas")
  // defined on the Entradas & Saídas screen, grouped by category (active
  // ones only) — same shape as the income breakdown below.
  const expenseData = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]))
    const totals = new Map<string, number>()
    for (const e of expenses) {
      if (!e.active) continue
      const key = e.categoryId || UNCATEGORIZED.id
      totals.set(key, (totals.get(key) ?? 0) + e.amount)
    }
    const slices: CategorySlice[] = [...totals.entries()]
      .map(([id, total]) => {
        const cat = byId.get(id)
        return cat ? { id: cat.id, name: cat.name, color: cat.color, icon: cat.icon, total } : { ...UNCATEGORIZED, total }
      })
      .sort((a, b) => b.total - a.total)
    return { slices, total: slices.reduce((s, x) => s + x.total, 0) }
  }, [expenses, categories])

  // Income grouped by category, mirroring the expense breakdown's shape.
  const incomeData = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]))
    const totals = new Map<string, number>()
    for (const i of incomes) {
      if (!i.active) continue
      const key = i.categoryId || UNCATEGORIZED.id
      totals.set(key, (totals.get(key) ?? 0) + i.amount)
    }
    const slices: CategorySlice[] = [...totals.entries()]
      .map(([id, total]) => {
        const cat = byId.get(id)
        return cat ? { id: cat.id, name: cat.name, color: cat.color, icon: cat.icon, total } : { ...UNCATEGORIZED, total }
      })
      .sort((a, b) => b.total - a.total)
    return { slices, total: slices.reduce((s, x) => s + x.total, 0) }
  }, [incomes, categories])

  // Snapshot this month's spending so future months can show a real trend.
  const key = monthKey()
  useEffect(() => {
    if (expenseData.total > 0) recordSnapshot(key, expenseData.slices)
  }, [key, expenseData])
  const prev = useMemo(() => previousTotals(key), [key])

  const { slices, total } = mode === "gastos" ? expenseData : incomeData
  const label = mode === "gastos" ? "Gasto total" : "Entradas"

  // Donut geometry: r chosen so the circumference is ~100, letting each
  // slice's dash length equal its percentage directly.
  const r = 15.915
  let offset = 25 // start at 12 o'clock
  const arcs = slices.map((s) => {
    const pct = total > 0 ? (s.total / total) * 100 : 0
    const arc = { s, pct, dash: pct, gap: 100 - pct, offset }
    offset -= pct
    return arc
  })

  const pctLabel = (v: number) => {
    const share = total > 0 ? (v / total) * 100 : 0
    return share >= 1 ? `${Math.round(share)}%` : "<1%"
  }

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PieChart className={cn("size-4", mode === "gastos" ? "text-red-500" : "text-emerald-500")} />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Distribuição dos {mode === "gastos" ? "gastos" : "entradas"}
          </h2>
        </div>
        <div className="flex shrink-0 rounded-lg bg-muted p-0.5 text-xs font-medium">
          {(["gastos", "entradas"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-2.5 py-1 capitalize transition-colors",
                mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {total <= 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {mode === "gastos"
            ? "Categorize compras e saídas para ver a distribuição."
            : "Categorize suas entradas para ver a distribuição."}
        </p>
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          {/* donut */}
          <div className="relative shrink-0">
            <svg viewBox="0 0 42 42" className="size-40">
              <circle cx="21" cy="21" r={r} fill="none" className="stroke-muted" strokeWidth="4" />
              {arcs.map((a) => (
                <circle
                  key={a.s.id}
                  cx="21"
                  cy="21"
                  r={r}
                  fill="none"
                  stroke={a.s.color}
                  strokeWidth="4"
                  strokeDasharray={`${a.dash} ${a.gap}`}
                  strokeDashoffset={a.offset}
                  transform="rotate(-90 21 21)"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] text-muted-foreground">{label}</span>
              <MoneyValue value={total} className="text-lg font-bold tabular-nums" />
            </div>
          </div>

          {/* ranked list */}
          <ul className="flex min-w-0 flex-1 flex-col gap-2.5 self-stretch">
            {slices.slice(0, 6).map((s) => {
              const trend = mode === "gastos" ? trendFor(prev, s.id, s.total) : null
              return (
                <li key={s.id} className="flex items-center gap-2.5">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${s.color}22` }}
                  >
                    <CategoryIcon name={s.icon} className="size-4" style={{ color: s.color }} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm" title={s.name}>
                    {s.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{pctLabel(s.total)}</span>
                  <MoneyValue value={s.total} className="w-20 shrink-0 text-right text-sm font-medium tabular-nums" />
                  {trend === "up" && <TrendingUp className="size-3.5 shrink-0 text-destructive" />}
                  {trend === "down" && <TrendingDown className="size-3.5 shrink-0 text-emerald-500" />}
                  {!trend && <span className="size-3.5 shrink-0" />}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Card>
  )
}
