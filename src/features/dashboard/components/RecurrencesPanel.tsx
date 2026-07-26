import { useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { useCardsStore } from "@/features/cards/store"
import { useAccountsStore } from "@/features/accounts/store"
import { breakdownForMonth, computeYearProjection, MONTH_LABELS, SERIES, yearTotal } from "../recurrences"
import { MonthlyBarChart } from "./MonthlyBarChart"

// Recorrências: a 12-month projection of committed spending (installments,
// subscriptions, one-offs and account debits) plus this month's breakdown.
// Kept deliberately simple — a static legend, no per-series/account/card
// toggles — so the section reads cleanly.
export function RecurrencesPanel() {
  const cards = useCardsStore((s) => s.cards)
  const accounts = useAccountsStore((s) => s.accounts)
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)
  const year = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  useEffect(() => {
    if (accounts.length === 0) fetchAccounts()
  }, [accounts.length, fetchAccounts])

  const projection = useMemo(() => computeYearProjection(cards, accounts, year), [cards, accounts, year])
  const hasData = useMemo(
    () => projection.some((p) => p.installments + p.subscriptions + p.oneOff + p.debit > 0),
    [projection]
  )
  const breakdown = breakdownForMonth(projection, currentMonth)
  const committed = yearTotal(projection)

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold">Recorrências</h2>
            <p className="text-sm text-muted-foreground">Projeção do ano / {year}</p>
          </div>
          {/* static legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {SERIES.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("size-2 rounded-full", s.color)} />
                {s.label}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Cadastre cartões ou compras no débito das contas para ver a projeção.
            </p>
          ) : (
            <div className="scrollbar-hide -mx-2 overflow-x-auto px-2">
              <div className="min-w-[440px]">
                <MonthlyBarChart data={projection} series={SERIES} highlightIndex={currentMonth} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">Pagamentos do mês</h2>
          <p className="text-sm text-muted-foreground">
            {MONTH_LABELS[currentMonth]} / {year}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-baseline gap-2">
            <MoneyValue value={breakdown.total} className="text-3xl font-bold tracking-tight tabular-nums" />
            <span className="text-sm text-muted-foreground">
              / <MoneyValue value={committed} /> no ano
            </span>
          </div>

          {breakdown.total > 0 && (
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
              {SERIES.map((s) => {
                const value = breakdown[s.key]
                if (value <= 0) return null
                return <div key={s.key} className={s.color} style={{ width: `${(value / breakdown.total) * 100}%` }} />
              })}
            </div>
          )}

          <ul className="flex flex-col gap-3">
            {SERIES.map((s) => (
              <li key={s.key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className={cn("size-2.5 rounded-full", s.color)} />
                  {s.label}
                </span>
                <MoneyValue value={breakdown[s.key]} className="font-medium tabular-nums" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
