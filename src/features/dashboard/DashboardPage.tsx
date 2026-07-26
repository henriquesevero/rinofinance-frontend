import { useEffect, useMemo } from "react"
import { CalendarDays, Loader2 } from "lucide-react"
import { useCardsStore } from "@/features/cards/store"
import { useCategoriesStore } from "@/features/categories/store"
import { BudgetCard } from "./components/BudgetCard"
import { FinancialOverview } from "./components/FinancialOverview"
import { SpendingDonut } from "./components/SpendingDonut"
import { computeCategorySpending } from "./categorySpending"
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
      <div className="flex items-start justify-between gap-3">
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
      <FinancialOverview />

      {/* budget + spending distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BudgetCard spent={spent} income={summary.totalIncome} />
        <SpendingDonut expenses={summary.expenses} incomes={summary.incomes} />
      </div>
    </div>
  )
}
