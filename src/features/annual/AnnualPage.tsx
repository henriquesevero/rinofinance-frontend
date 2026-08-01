import { useEffect, useMemo, useState } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Scale,
  TrendingUp,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MoneyValue } from "@/components/MoneyValue"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { cn } from "@/lib/utils"
import { CategoryIcon } from "@/features/categories/categoryIcons"
import { useCategoriesStore } from "@/features/categories/store"
import { useInvestmentsStore } from "@/features/investments/store"
import { AnnualBarChart } from "./AnnualBarChart"
import { useAnnualData } from "./useAnnualData"

const FULL_MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
const UNCATEGORIZED = { name: "Sem categoria", color: "#9CA3AF", icon: "tag" }

// "Visão anual": how the whole year went, month by month — realized income vs.
// spending, the annual bottom line, best/worst months, and where the money
// went. Navigate any year with the ‹ › selector.
export function AnnualPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const { data, isLoading, error } = useAnnualData(year)
  const byId = useCategoriesStore((s) => s.byId)
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories)
  const categoriesCount = useCategoriesStore((s) => s.categories.length)

  useEffect(() => {
    if (categoriesCount === 0) fetchCategories()
  }, [categoriesCount, fetchCategories])

  const highlightIndex = year === now.getFullYear() ? now.getMonth() : undefined

  const topCategories = useMemo(() => {
    if (!data) return []
    return data.categoryTotals.slice(0, 6).map((c) => {
      const cat = c.id === "__none__" ? UNCATEGORIZED : byId(c.id) ?? UNCATEGORIZED
      return { ...c, name: cat.name, color: cat.color, icon: cat.icon ?? "tag" }
    })
  }, [data, byId])

  return (
    <div className="flex flex-col gap-6">
      <div className="rf-fade-up flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão anual</h1>
          <p className="text-muted-foreground">Como foi o seu ano, mês a mês.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ValuesVisibilityToggle />
          <div className="flex items-center gap-0.5 rounded-full border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Ano anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[3.5rem] text-center text-sm font-semibold tabular-nums">{year}</span>
            <button
              type="button"
              onClick={() => setYear((y) => Math.min(now.getFullYear(), y + 1))}
              disabled={year >= now.getFullYear()}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              aria-label="Próximo ano"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading && !data ? (
        <AnnualSkeleton />
      ) : error && !data ? (
        <p className="text-center text-destructive">{error}</p>
      ) : !data ? null : data.activeMonths === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarRange className="size-6" />
          </span>
          <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada em {year}.</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Marque entradas como recebidas e saídas como pagas no Fluxo do mês para ver o ano tomar forma aqui.
          </p>
        </Card>
      ) : (
        <>
          {/* year totals */}
          <Card className="rf-fade-up gap-0 overflow-hidden p-0" style={{ animationDelay: "60ms" }}>
            <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
              <Cell label="Entradas no ano">
                <MoneyValue value={data.totalIncome} className="text-xl font-bold tabular-nums text-emerald-500 sm:text-2xl" />
              </Cell>
              <Cell label="Saídas no ano">
                <MoneyValue value={data.totalExpense} className="text-xl font-bold tabular-nums text-red-500 sm:text-2xl" />
              </Cell>
              <Cell label="Saldo do ano" className="col-span-2 sm:col-span-1">
                <MoneyValue
                  value={data.net}
                  className={cn(
                    "text-xl font-bold tabular-nums sm:text-2xl",
                    data.net < 0 ? "text-red-500" : "text-emerald-500"
                  )}
                />
              </Cell>
            </div>
          </Card>

          {/* the year at a glance */}
          <Card className="rf-fade-up flex flex-col gap-4 p-4 sm:p-5" style={{ animationDelay: "120ms" }}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Entradas e saídas por mês</h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" /> Entradas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-red-500" /> Saídas
                </span>
              </div>
            </div>
            <AnnualBarChart months={data.months} highlightIndex={highlightIndex} />
          </Card>

          {/* insights */}
          <div className="rf-fade-up grid grid-cols-2 gap-3 lg:grid-cols-4" style={{ animationDelay: "160ms" }}>
            <Insight
              icon={ArrowUpRight}
              tone="emerald"
              label="Melhor mês"
              value={data.bestMonth ? <MoneyValue value={data.bestMonth.net} /> : "—"}
              sub={data.bestMonth ? FULL_MONTHS[data.bestMonth.index] : undefined}
            />
            <Insight
              icon={ArrowDownRight}
              tone="red"
              label="Pior mês"
              value={data.worstMonth ? <MoneyValue value={data.worstMonth.net} /> : "—"}
              sub={data.worstMonth ? FULL_MONTHS[data.worstMonth.index] : undefined}
            />
            <Insight
              icon={Scale}
              label="Saldo médio mensal"
              value={<MoneyValue value={data.avgNet} />}
              tone={data.avgNet < 0 ? "red" : "emerald"}
              sub={`em ${data.activeMonths} ${data.activeMonths === 1 ? "mês" : "meses"}`}
            />
            <Insight
              icon={PiggyBank}
              tone="emerald"
              label="Taxa de poupança"
              value={data.savingsRate === null ? "—" : `${Math.round(data.savingsRate * 100)}%`}
              sub="do que entrou, sobrou"
            />
          </div>

          {/* month-by-month breakdown */}
          <Card className="rf-fade-up flex flex-col gap-1 p-4 sm:p-5" style={{ animationDelay: "200ms" }}>
            <div className="mb-1 hidden grid-cols-[1fr_auto_auto_auto] gap-4 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
              <span>Mês</span>
              <span className="w-24 text-right">Entradas</span>
              <span className="w-24 text-right">Saídas</span>
              <span className="w-24 text-right">Saldo</span>
            </div>
            <ul className="flex flex-col">
              {data.months.map((m) => {
                const empty = m.income === 0 && m.expense === 0
                return (
                  <li
                    key={m.index}
                    className={cn(
                      "grid grid-cols-2 items-center gap-x-4 gap-y-0.5 rounded-md px-1 py-2 sm:grid-cols-[1fr_auto_auto_auto]",
                      highlightIndex === m.index && "bg-muted/40",
                      empty && "opacity-45"
                    )}
                  >
                    <span className="text-sm font-medium">{FULL_MONTHS[m.index]}</span>
                    <MoneyValue value={m.income} className="order-3 w-24 text-right text-sm tabular-nums text-emerald-500 sm:order-none" />
                    <MoneyValue value={m.expense} className="order-4 w-24 text-right text-sm tabular-nums text-red-500 sm:order-none" />
                    <MoneyValue
                      value={m.net}
                      className={cn(
                        "order-2 w-24 text-right text-sm font-semibold tabular-nums sm:order-none",
                        m.net < 0 ? "text-red-500" : "text-emerald-500"
                      )}
                    />
                  </li>
                )
              })}
            </ul>
          </Card>

          {/* where the money went */}
          {topCategories.length > 0 && (
            <Card className="rf-fade-up flex flex-col gap-4 p-4 sm:p-5" style={{ animationDelay: "240ms" }}>
              <h2 className="text-sm font-semibold">Onde você gastou no ano</h2>
              <ul className="flex flex-col gap-3">
                {topCategories.map((c) => {
                  const share = data.totalExpense > 0 ? (c.total / data.totalExpense) * 100 : 0
                  return (
                    <li key={c.id} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${c.color}22` }}
                        >
                          <CategoryIcon name={c.icon} className="size-4" style={{ color: c.color }} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm" title={c.name}>
                          {c.name}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{Math.round(share)}%</span>
                        <MoneyValue value={c.total} className="w-24 shrink-0 text-right text-sm font-medium tabular-nums" />
                      </div>
                      <div className="ml-[2.375rem] h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: c.color }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function Cell({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col justify-center gap-0.5 bg-card p-4 sm:gap-1 sm:p-5", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function Insight({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Scale
  label: string
  value: React.ReactNode
  sub?: string
  tone?: "emerald" | "red"
}) {
  const toneClass = tone === "emerald" ? "text-emerald-500" : tone === "red" ? "text-red-500" : "text-muted-foreground"
  return (
    <Card className="flex flex-col gap-1 p-3.5">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className={cn("size-3.5", toneClass)} />
        {label}
      </span>
      <div className={cn("text-lg font-bold tracking-tight tabular-nums", toneClass)}>{value}</div>
      {sub && <p className="text-[11px] leading-tight text-muted-foreground">{sub}</p>}
    </Card>
  )
}

function AnnualSkeleton() {
  return (
    <>
      <Card className="gap-0 overflow-hidden p-0">
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2 bg-card p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="flex flex-col gap-4 p-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-56 w-full" />
      </Card>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="flex flex-col gap-2 p-3.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
          </Card>
        ))}
      </div>
    </>
  )
}
