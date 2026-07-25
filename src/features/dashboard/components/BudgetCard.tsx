import { useMemo, useState } from "react"
import { Check, Pencil, Sparkles, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoneyValue } from "@/components/MoneyValue"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"
import { useBudgetStore } from "../budgetStore"

interface BudgetCardProps {
  // Month's spending so far and total income, both already computed upstream.
  spent: number
  income: number
}

const H = 44 // svg height (viewBox units)
const W = 100

// "Você ainda pode gastar": the hero card. Shows how much of the monthly
// budget is left, a spending-vs-pace trajectory chart, and a savings tip.
// The budget is set inline (no separate settings page needed).
export function BudgetCard({ spent, income }: BudgetCardProps) {
  const budget = useBudgetStore((s) => s.budget)
  const setBudget = useBudgetStore((s) => s.setBudget)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const frac = Math.min(1, now.getDate() / daysInMonth) // fraction of month elapsed

  const remaining = budget - spent
  const targetAtNow = budget * frac
  const onTrack = spent <= targetAtNow
  const stroke = onTrack ? "#22c55e" : "#f59e0b"

  const chart = useMemo(() => {
    const max = Math.max(budget, spent, 1) * 1.05
    const y = (v: number) => H - (v / max) * (H - 4) - 2
    const xNow = frac * W
    // pace projection to month-end, capped at the chart's range
    const projected = frac > 0 ? Math.min(spent / frac, max) : spent
    return {
      target: `M0,${y(0)} L${W},${y(budget)}`,
      actual: `M0,${y(0)} L${xNow.toFixed(1)},${y(spent)}`,
      area: `M0,${y(0)} L${xNow.toFixed(1)},${y(spent)} L${xNow.toFixed(1)},${H} L0,${H} Z`,
      future: `M${xNow.toFixed(1)},${y(spent)} L${W},${y(projected)}`,
      dotX: xNow,
      dotY: y(spent),
    }
  }, [budget, spent, frac])

  const surplus = income - spent
  const projection = surplus > 0 ? surplus * 3 : 0

  function startEdit() {
    setDraft(budget ? String(budget) : "")
    setEditing(true)
  }
  function save() {
    setBudget(Number(draft.replace(",", ".")))
    setEditing(false)
  }

  return (
    <Card className="relative flex flex-col gap-4 overflow-hidden p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Você ainda pode gastar</p>
          {budget > 0 ? (
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <MoneyValue
                value={Math.max(remaining, 0)}
                className={cn(
                  "text-3xl font-bold tracking-tight tabular-nums sm:text-4xl",
                  remaining < 0 && "text-destructive"
                )}
              />
              <span className="text-sm text-muted-foreground tabular-nums">/ {formatMoney(budget)}</span>
            </div>
          ) : (
            <p className="mt-1 text-lg font-semibold text-muted-foreground">Defina seu orçamento do mês</p>
          )}
        </div>
        {budget > 0 && !editing && (
          <Button variant="ghost" size="icon" className="shrink-0" onClick={startEdit} aria-label="Editar orçamento">
            <Pencil className="size-4" />
          </Button>
        )}
      </div>

      {editing || budget === 0 ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              autoFocus
              placeholder="5.000,00"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="pl-9"
            />
          </div>
          <Button size="icon" onClick={save} aria-label="Salvar orçamento">
            <Check className="size-4" />
          </Button>
          {budget > 0 && (
            <Button variant="ghost" size="icon" onClick={() => setEditing(false)} aria-label="Cancelar">
              <X className="size-4" />
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* spending trajectory vs. an even budget pace (dashed) */}
          <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="budget-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={chart.target} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" className="text-muted-foreground/50" fill="none" />
            <path d={chart.area} fill="url(#budget-fill)" />
            <path d={chart.actual} stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d={chart.future} stroke={stroke} strokeWidth="1" strokeDasharray="1.5 1.5" strokeOpacity="0.5" fill="none" />
            <circle cx={chart.dotX} cy={chart.dotY} r="1.8" fill={stroke} stroke="var(--background)" strokeWidth="0.8" />
          </svg>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Gasto: <MoneyValue value={spent} className="font-medium text-foreground tabular-nums" />
            </span>
            <span className={cn("font-medium", onTrack ? "text-emerald-500" : "text-amber-500")}>
              {onTrack ? "Dentro do ritmo" : "Acima do ritmo"}
            </span>
          </div>
        </>
      )}

      {/* savings tip */}
      {budget > 0 && !editing && (
        <div className="-mx-5 -mb-5 mt-1 flex items-start gap-2.5 bg-primary px-5 py-3.5 text-primary-foreground sm:-mx-6 sm:-mb-6 sm:px-6">
          <Sparkles className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm">
            {projection > 0 ? (
              <>
                Nesse ritmo, em 3 meses você terá <strong className="font-semibold">{formatMoney(projection)}</strong>{" "}
                guardados.
              </>
            ) : (
              "Atenção: neste mês seus gastos estão maiores que suas entradas."
            )}
          </p>
        </div>
      )}
    </Card>
  )
}
