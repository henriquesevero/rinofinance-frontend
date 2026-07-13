import { useEffect } from "react"
import { BarChart3, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
          <p className="text-sm text-muted-foreground">
            Sua visão financeira do mês — entradas, saídas e recorrências.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleCharts}>
          <BarChart3 className="size-4" />
          {chartsHidden ? "Mostrar gráficos" : "Ocultar gráficos"}
        </Button>
      </div>

      <QuickActions />

      <SummaryCards
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        netBalance={summary.netBalance}
      />

      {!chartsHidden && (
        <>
          <RecurrencesPanel />
          <CategoryBreakdownPanel expenses={summary.expenses} />
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeSection incomes={summary.incomes} />
        <ExpenseSection expenses={summary.expenses} />
      </div>
    </div>
  )
}
