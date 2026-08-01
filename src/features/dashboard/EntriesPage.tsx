import { useEffect, useMemo, useState } from "react"
import { FolderTree, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { cn } from "@/lib/utils"
import { useCategoriesStore } from "@/features/categories/store"
import { QuickActions } from "./components/QuickActions"
import { ExpenseSection } from "./components/ExpenseSection"
import { IncomeSection } from "./components/IncomeSection"
import { SummaryCards } from "./components/SummaryCards"
import { useMonthStore } from "@/lib/monthStore"
import { useDashboardStore } from "./store"

// Shared filter/search/group state applied to both income and expense lists.
export interface EntriesFilters {
  search: string
  pendingOnly: boolean
  categoryId: string
  groupBy: boolean
}

const ALL = "__all__"

// Entradas & Saídas: everything about managing the month's recurring income
// and expenses — moved off the dashboard so it stays a pure overview.
export function EntriesPage() {
  const summary = useDashboardStore((s) => s.summary)
  const isLoading = useDashboardStore((s) => s.isLoading)
  const error = useDashboardStore((s) => s.error)
  const fetchSummary = useDashboardStore((s) => s.fetchSummary)
  const month = useMonthStore((s) => s.month)
  const categories = useCategoriesStore((s) => s.categories)
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories)

  const [search, setSearch] = useState("")
  const [pendingOnly, setPendingOnly] = useState(false)
  const [categoryId, setCategoryId] = useState("")
  const [groupBy, setGroupBy] = useState(false)

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary, month])

  useEffect(() => {
    if (categories.length === 0) fetchCategories()
  }, [categories.length, fetchCategories])

  const filters: EntriesFilters = { search, pendingOnly, categoryId, groupBy }

  // Realized totals for the summary: only active items count (matching the
  // totalIncome/totalExpense the API already sums as "ativas").
  const { receivedIncome, paidExpense } = useMemo(() => {
    let receivedIncome = 0
    let paidExpense = 0
    for (const i of summary?.incomes ?? []) if (i.active && i.received) receivedIncome += i.amount
    for (const e of summary?.expenses ?? []) if (e.active && e.paid) paidExpense += e.amount
    return { receivedIncome, paidExpense }
  }, [summary])

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
          <h1 className="text-2xl font-bold tracking-tight">Entradas & Saídas</h1>
          <p className="text-muted-foreground">Gerencie suas receitas e despesas do mês.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ValuesVisibilityToggle />
          <QuickActions />
        </div>
      </div>

      <SummaryCards
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        netBalance={summary.netBalance}
        receivedIncome={receivedIncome}
        paidExpense={paidExpense}
      />

      {/* toolbar: search + quick filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[9rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="h-9 pl-8"
          />
        </div>
        <Button
          variant={pendingOnly ? "default" : "outline"}
          size="sm"
          className="h-9"
          onClick={() => setPendingOnly((p) => !p)}
        >
          Pendentes
        </Button>
        <Select value={categoryId || ALL} onValueChange={(v) => setCategoryId(v === ALL ? "" : (v ?? ""))}>
          <SelectTrigger className="h-9 w-40" aria-label="Filtrar por categoria">
            <SelectValue>
              {(value: string | null) =>
                value && value !== ALL
                  ? categories.find((c) => c.id === value)?.name ?? "Categoria"
                  : "Todas categorias"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={groupBy ? "default" : "outline"}
          size="sm"
          className={cn("h-9", groupBy && "gap-1.5")}
          onClick={() => setGroupBy((g) => !g)}
        >
          <FolderTree className="size-4" />
          Agrupar
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <IncomeSection incomes={summary.incomes} filters={filters} />
        <ExpenseSection expenses={summary.expenses} filters={filters} />
      </div>
    </div>
  )
}
