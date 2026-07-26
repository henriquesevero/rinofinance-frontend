import { useEffect } from "react"
import { BarChart3, Loader2 } from "lucide-react"
import { CategoryBreakdownPanel } from "./components/CategoryBreakdownPanel"
import { QuickActions } from "./components/QuickActions"
import { ExpenseSection } from "./components/ExpenseSection"
import { IncomeSection } from "./components/IncomeSection"
import { RecurrencesPanel } from "./components/RecurrencesPanel"
import { SummaryCards } from "./components/SummaryCards"
import { useMonthStore } from "@/lib/monthStore"
import { useChartsPrefStore } from "./chartsPrefStore"
import { useDashboardStore } from "./store"

// Entradas & Saídas: everything about managing the month's recurring income
// and expenses — moved off the dashboard so it stays a pure overview.
export function EntriesPage() {
  const summary = useDashboardStore((s) => s.summary)
  const isLoading = useDashboardStore((s) => s.isLoading)
  const error = useDashboardStore((s) => s.error)
  const fetchSummary = useDashboardStore((s) => s.fetchSummary)
  const chartsHidden = useChartsPrefStore((s) => s.hidden)
  const toggleCharts = useChartsPrefStore((s) => s.toggle)
  const month = useMonthStore((s) => s.month)

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary, month])

  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (error && !summary) {
    return <p className="text-center text-destructive">{error}</p>
  }

  if (!summary) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Entradas & Saídas</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas receitas e despesas do mês.</p>
        </div>
        <QuickActions />
      </div>

      <SummaryCards
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        netBalance={summary.netBalance}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <IncomeSection incomes={summary.incomes} />
        <ExpenseSection expenses={summary.expenses} />
      </div>

      {/* charts live at the end — secondary to managing the month's lines */}
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
    </div>
  )
}
