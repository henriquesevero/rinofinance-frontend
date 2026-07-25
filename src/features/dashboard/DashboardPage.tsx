import { useEffect, useMemo } from "react"
import { BarChart3, CalendarDays, Loader2 } from "lucide-react"
import { useCardsStore } from "@/features/cards/store"
import { useCategoriesStore } from "@/features/categories/store"
import { BudgetCard } from "./components/BudgetCard"
import { CategoryBreakdownPanel } from "./components/CategoryBreakdownPanel"
import { QuickActions } from "./components/QuickActions"
import { ExpenseSection } from "./components/ExpenseSection"
import { IncomeSection } from "./components/IncomeSection"
import { RecurrencesPanel } from "./components/RecurrencesPanel"
import { SpendingDonut } from "./components/SpendingDonut"
import { SummaryCards } from "./components/SummaryCards"
import { UpcomingBills } from "./components/UpcomingBills"
import { computeCategorySpending } from "./categorySpending"
import { useChartsPrefStore } from "./chartsPrefStore"
import { useDashboardStore } from "./store"

// Current month name, e.g. "Julho de 2026" — capitalized.
function currentMonthLabel() {
  const s = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function DashboardPage() {
  const summary = useDashboardStore((s) => s.summary)
  const isLoading = useDashboardStore((s) => s.isLoading)
  const error = useDashboardStore((s) => s.error)
  const fetchSummary = useDashboardStore((s) => s.fetchSummary)
  const cards = useCardsStore((s) => s.cards)
  const fetchCards = useCardsStore((s) => s.fetchCards)
  const categories = useCategoriesStore((s) => s.categories)
  const chartsHidden = useChartsPrefStore((s) => s.hidden)
  const toggleCharts = useChartsPrefStore((s) => s.toggle)

  useEffect(() => {
    fetchSummary()
    fetchCards()
  }, [fetchSummary, fetchCards])

  const spent = useMemo(
    () => (summary ? computeCategorySpending(cards, summary.expenses, categories).total : 0),
    [cards, summary, categories]
  )

  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Carregando painel...
      </div>
    )
  }

  if (error && !summary) {
    return <p className="text-center text-destructive">{error}</p>
  }

  if (!summary) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Visão Geral</h1>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium">
          <CalendarDays className="size-4 text-muted-foreground" />
          {currentMonthLabel()}
        </span>
      </div>

      <QuickActions />

      {/* hero row: budget on the left, spending donut on the right */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BudgetCard spent={spent} income={summary.totalIncome} />
        <SpendingDonut expenses={summary.expenses} incomes={summary.incomes} />
      </div>

      <UpcomingBills expenses={summary.expenses} />

      <SummaryCards
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        netBalance={summary.netBalance}
      />

      {chartsHidden ? (
        <button
          type="button"
          onClick={toggleCharts}
          className="mx-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <BarChart3 className="size-3.5" />
          Mostrar gráficos
        </button>
      ) : (
        <>
          <RecurrencesPanel />
          <CategoryBreakdownPanel expenses={summary.expenses} />
          <button
            type="button"
            onClick={toggleCharts}
            className="mx-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <BarChart3 className="size-3.5" />
            Ocultar gráficos
          </button>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeSection incomes={summary.incomes} />
        <ExpenseSection expenses={summary.expenses} />
      </div>
    </div>
  )
}
