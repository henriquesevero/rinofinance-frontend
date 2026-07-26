import { useEffect } from "react"
import { CalendarDays } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCardsStore } from "@/features/cards/store"
import { MonthBalanceCard } from "./components/MonthBalanceCard"
import { FinancialOverview } from "./components/FinancialOverview"
import { SpendingDonut } from "./components/SpendingDonut"
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
  const fetchCards = useCardsStore((s) => s.fetchCards)

  useEffect(() => {
    fetchSummary()
    fetchCards()
  }, [fetchSummary, fetchCards])

  if (isLoading && !summary) {
    return <DashboardSkeleton />
  }

  if (error && !summary) {
    return <p className="text-center text-destructive">{error}</p>
  }

  if (!summary) return null

  // Spent = sum of the month's active expenses ("saídas"), matching the
  // spending-distribution donut so both figures agree.
  const spent = summary.expenses.reduce((sum, e) => (e.active ? sum + e.amount : sum), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="rf-fade-up flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-sm text-muted-foreground">Visão geral dos seus dados financeiros.</p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium">
          <CalendarDays className="size-4 text-muted-foreground" />
          {currentMonthLabel()}
        </span>
      </div>

      {/* financial overview: accounts, cards, investments */}
      <div className="rf-fade-up" style={{ animationDelay: "70ms" }}>
        <FinancialOverview />
      </div>

      {/* month balance + spending distribution */}
      <div className="rf-fade-up grid gap-6 lg:grid-cols-2" style={{ animationDelay: "140ms" }}>
        <MonthBalanceCard income={summary.totalIncome} spent={spent} />
        <SpendingDonut expenses={summary.expenses} incomes={summary.incomes} />
      </div>
    </div>
  )
}

// Layout-matching placeholders shown while the dashboard loads — a calmer,
// more polished first paint than a spinner.
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
