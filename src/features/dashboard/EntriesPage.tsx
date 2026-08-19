import { useEffect, useMemo, useState } from "react"
import { FolderTree, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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

export interface EntriesFilters {
  search: string
  pendingOnly: boolean
  categoryId: string
  groupBy: boolean
}

const ALL = "__all__"

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

  const { receivedIncome, paidExpense } = useMemo(() => {
    let receivedIncome = 0
    let paidExpense = 0
    for (const i of summary?.incomes ?? []) if (i.active && i.received) receivedIncome += i.amount
    for (const e of summary?.expenses ?? []) if (e.active && e.paid) paidExpense += e.amount
    return { receivedIncome, paidExpense }
  }, [summary])

  if (isLoading && !summary) {
    return <EntriesSkeleton />
  }

  if (error && !summary) {
    return <p className="text-center text-destructive">{error}</p>
  }

  if (!summary) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="rf-fade-up flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Fluxo do mês</h1>
          <p className="hidden text-muted-foreground sm:block">Entradas e saídas — o que entra, o que sai e o que sobra.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ValuesVisibilityToggle />
          <QuickActions />
        </div>
      </div>

      <div className="rf-fade-up" style={{ animationDelay: "60ms" }}>
        <SummaryCards
          totalIncome={summary.totalIncome}
          totalExpense={summary.totalExpense}
          netBalance={summary.netBalance}
          receivedIncome={receivedIncome}
          paidExpense={paidExpense}
        />
      </div>

      <div className="rf-fade-up flex flex-wrap items-center gap-2" style={{ animationDelay: "120ms" }}>
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

      <div className="rf-fade-up grid items-start gap-6 lg:grid-cols-2" style={{ animationDelay: "180ms" }}>
        <IncomeSection incomes={summary.incomes} filters={filters} />
        <ExpenseSection expenses={summary.expenses} filters={filters} />
      </div>
    </div>
  )
}

function EntriesSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="size-9 rounded-md" />
      </div>
      <Card className="gap-0 overflow-hidden p-0">
        <div className="grid gap-px bg-border sm:grid-cols-[1.2fr_1fr_1fr]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2 bg-card p-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </Card>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i} className="flex flex-col gap-4 p-4">
            <Skeleton className="h-5 w-40" />
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  )
}
