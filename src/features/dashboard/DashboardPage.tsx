import { useEffect, useState } from "react"
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { useCardsStore } from "@/features/cards/store"
import { currentMonth, monthLabel, useMonthStore } from "@/lib/monthStore"
import { CategoryBreakdownPanel } from "./components/CategoryBreakdownPanel"
import { MonthBalanceCard } from "./components/MonthBalanceCard"
import { FinancialOverview } from "./components/FinancialOverview"
import { RecurrencesPanel } from "./components/RecurrencesPanel"
import { SpendingDonut } from "./components/SpendingDonut"
import { useDashboardStore } from "./store"

export function DashboardPage() {
  const summary = useDashboardStore((s) => s.summary)
  const isLoading = useDashboardStore((s) => s.isLoading)
  const error = useDashboardStore((s) => s.error)
  const fetchSummary = useDashboardStore((s) => s.fetchSummary)
  const fetchCards = useCardsStore((s) => s.fetchCards)
  const month = useMonthStore((s) => s.month)
  const shift = useMonthStore((s) => s.shift)
  const goToCurrent = useMonthStore((s) => s.goToCurrent)
  const atCurrent = month === currentMonth()
  const [showCharts, setShowCharts] = useState(false)

  useEffect(() => {
    fetchSummary()
    fetchCards()
  }, [fetchSummary, fetchCards, month])

  if (isLoading && !summary) {
    return <DashboardSkeleton />
  }

  if (error && !summary) {
    return <p className="text-center text-destructive">{error}</p>
  }

  if (!summary) return null

  const spent = summary.expenses.reduce((sum, e) => (e.active ? sum + e.amount : sum), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="rf-fade-up flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Visão Geral</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">Visão geral dos seus dados financeiros.</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 self-end sm:self-auto">
          <div className="flex items-center gap-1">
            <ValuesVisibilityToggle />
            <div className="flex items-center gap-0.5 rounded-full border bg-card p-0.5 text-sm font-medium">
              <button
                type="button"
                onClick={() => shift(-1)}
                aria-label="Mês anterior"
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-0 truncate">{monthLabel(month)}</span>
              <button
                type="button"
                onClick={() => shift(1)}
                aria-label="Próximo mês"
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
          {!atCurrent && (
            <button
              type="button"
              onClick={goToCurrent}
              className="pr-1 text-xs font-medium text-primary hover:underline"
            >
              Voltar ao mês atual
            </button>
          )}
        </div>
      </div>

      <div className="rf-fade-up" style={{ animationDelay: "70ms" }}>
        <FinancialOverview />
      </div>

      <div className="rf-fade-up grid gap-6 lg:grid-cols-2" style={{ animationDelay: "140ms" }}>
        <MonthBalanceCard income={summary.totalIncome} spent={spent} />
        <SpendingDonut expenses={summary.expenses} incomes={summary.incomes} />
      </div>

      {showCharts ? (
        <>
          <RecurrencesPanel />
          <CategoryBreakdownPanel expenses={summary.expenses} month={month} />
          <button
            type="button"
            onClick={() => setShowCharts(false)}
            className="mx-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <BarChart3 className="size-3.5" />
            Ocultar gráficos
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setShowCharts(true)}
          className="mx-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <BarChart3 className="size-3.5" />
          Mostrar gráficos
        </button>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="flex flex-col gap-4 p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-40" />
            <div className="flex flex-col gap-3 border-t pt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i} className="flex flex-col gap-5 p-5 sm:p-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-28 w-full" />
          </Card>
        ))}
      </div>
    </div>
  )
}
