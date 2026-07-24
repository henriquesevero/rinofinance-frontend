import { useEffect } from "react"
import { BarChart3, Loader2 } from "lucide-react"
import { useCardsStore } from "@/features/cards/store"
import { CategoryBreakdownPanel } from "./components/CategoryBreakdownPanel"
import { QuickActions } from "./components/QuickActions"
import { ExpenseSection } from "./components/ExpenseSection"
import { IncomeSection } from "./components/IncomeSection"
import { RecurrencesPanel } from "./components/RecurrencesPanel"
import { SummaryCards } from "./components/SummaryCards"
import { useChartsPrefStore } from "./chartsPrefStore"
import { useDashboardStore } from "./store"

export function DashboardPage() {
  const summary = useDashboardStore((s) => s.summary)
  const isLoading = useDashboardStore((s) => s.isLoading)
  const error = useDashboardStore((s) => s.error)
  const fetchSummary = useDashboardStore((s) => s.fetchSummary)
  const fetchCards = useCardsStore((s) => s.fetchCards)
  const chartsHidden = useChartsPrefStore((s) => s.hidden)
  const toggleCharts = useChartsPrefStore((s) => s.toggle)

  useEffect(() => {
    fetchSummary()
    fetchCards()
  }, [fetchSummary, fetchCards])

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
      <QuickActions />

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
