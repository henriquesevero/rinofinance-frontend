import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { useCardsStore } from "@/features/cards/store"
import { useAccountsStore } from "@/features/accounts/store"
import {
  breakdownForMonth,
  computeYearProjection,
  MONTH_LABELS,
  SERIES,
  yearTotal,
  type SeriesKey,
} from "../recurrences"
import { MonthlyBarChart } from "./MonthlyBarChart"

export function RecurrencesPanel() {
  const cards = useCardsStore((s) => s.cards)
  const accounts = useAccountsStore((s) => s.accounts)
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)
  const [cardFilter, setCardFilter] = useState<string>("all")
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set())
  // Accounts explicitly excluded from the debit series; empty = all included.
  const [excludedAccounts, setExcludedAccounts] = useState<Set<string>>(new Set())

  const year = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  useEffect(() => {
    if (accounts.length === 0) fetchAccounts()
  }, [accounts.length, fetchAccounts])

  const filteredCards = useMemo(
    () => (cardFilter === "all" ? cards : cards.filter((c) => c.id === cardFilter)),
    [cards, cardFilter]
  )
  const includedAccounts = useMemo(
    () => accounts.filter((a) => !excludedAccounts.has(a.id)),
    [accounts, excludedAccounts]
  )
  const projection = useMemo(
    () => computeYearProjection(filteredCards, includedAccounts, year),
    [filteredCards, includedAccounts, year]
  )
  const visibleSeries = useMemo(() => SERIES.filter((s) => !hidden.has(s.key)), [hidden])
  const hasData = useMemo(
    () => projection.some((p) => p.installments + p.subscriptions + p.oneOff + p.debit > 0),
    [projection]
  )

  const breakdown = breakdownForMonth(projection, currentMonth)
  const committed = yearTotal(projection)

  function toggleSeries(key: SeriesKey) {
    setHidden((prev) => {
      const next = new Set(prev)
      // Never let the user hide every series (chart would be empty).
      if (next.has(key)) next.delete(key)
      else if (next.size < SERIES.length - 1) next.add(key)
      return next
    })
  }

  function toggleAccount(id: string) {
    setExcludedAccounts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Recorrências</h2>
              <p className="text-sm text-muted-foreground">Projeção do ano / {year}</p>
            </div>
            <Select value={cardFilter} onValueChange={(v) => setCardFilter(v ?? "all")}>
              <SelectTrigger size="sm" className="w-[180px]" aria-label="Filtrar por cartão">
                <SelectValue>
                  {(value: string | null) =>
                    value && value !== "all"
                      ? cards.find((c) => c.id === value)?.name ?? "Cartão"
                      : "Todos os cartões"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cartões</SelectItem>
                {cards.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* clickable legend / series toggles */}
          <div className="flex flex-wrap gap-2">
            {SERIES.map((s) => {
              const active = !hidden.has(s.key)
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleSeries(s.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    active ? "bg-muted/50" : "text-muted-foreground opacity-60 hover:opacity-100"
                  )}
                >
                  <span className={cn("size-2 rounded-full", s.color)} />
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* which accounts feed the "Débito (conta)" series */}
          {accounts.length > 0 && !hidden.has("debit") && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Débito das contas:</span>
              {accounts.map((a) => {
                const active = !excludedAccounts.has(a.id)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAccount(a.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      active ? "bg-muted/50" : "text-muted-foreground opacity-60 hover:opacity-100"
                    )}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: a.color || "#6B7280" }}
                    />
                    {a.name}
                  </button>
                )
              })}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Cadastre cartões ou compras no débito das contas para ver a projeção.
            </p>
          ) : (
            <MonthlyBarChart data={projection} series={visibleSeries} highlightIndex={currentMonth} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">Pagamentos do mês</h2>
          <p className="text-sm text-muted-foreground">{MONTH_LABELS[currentMonth]} / {year}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-baseline gap-2">
            <MoneyValue
              value={breakdown.total}
              className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400"
            />
            <span className="text-sm text-muted-foreground">
              / <MoneyValue value={committed} /> no ano
            </span>
          </div>

          {/* stacked composition bar */}
          {breakdown.total > 0 && (
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
              {SERIES.map((s) => {
                const value = breakdown[s.key]
                if (value <= 0) return null
                return (
                  <div
                    key={s.key}
                    className={s.color}
                    style={{ width: `${(value / breakdown.total) * 100}%` }}
                  />
                )
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
