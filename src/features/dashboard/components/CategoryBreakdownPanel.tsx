import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { useCardsStore } from "@/features/cards/store"
import { useCategoriesStore } from "@/features/categories/store"
import { computeCategorySpending } from "../categorySpending"
import type { Expense } from "../types"

interface CategoryBreakdownPanelProps {
  expenses: Expense[]
}

// "Gastos por categoria": a single stacked bar of the month's spending split
// by category, with a compact legend below. Hovering a segment reveals its
// category and amount.
export function CategoryBreakdownPanel({ expenses }: CategoryBreakdownPanelProps) {
  const cards = useCardsStore((s) => s.cards)
  const categories = useCategoriesStore((s) => s.categories)
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    if (categories.length === 0) fetchCategories()
  }, [categories.length, fetchCategories])

  const { slices, total } = useMemo(
    () => computeCategorySpending(cards, expenses, categories),
    [cards, expenses, categories]
  )

  // Precompute each segment's horizontal position so the tooltip can sit
  // centered over the hovered slice.
  const segments = useMemo(() => {
    let acc = 0
    return slices.map((s) => {
      const start = (acc / total) * 100
      const width = (s.total / total) * 100
      acc += s.total
      return { slice: s, start, width, center: start + width / 2 }
    })
  }, [slices, total])

  const pct = (value: number) => {
    const share = (value / total) * 100
    return share >= 1 ? `${Math.round(share)}%` : "<1%"
  }

  const activeSeg = segments.find((seg) => seg.slice.id === hovered) ?? null

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Gastos por categoria</h2>
          <p className="text-sm text-muted-foreground">Distribuição da fatura e saídas do mês.</p>
        </div>
        {total > 0 && (
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
            <MoneyValue value={total} className="text-lg font-semibold tabular-nums" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {total <= 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Categorize compras e saídas para ver a distribuição.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {/* stacked bar */}
            <div className="relative" onMouseLeave={() => setHovered(null)}>
              {activeSeg && (
                <div
                  className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md"
                  style={{ left: `${activeSeg.center}%` }}
                >
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="size-2 rounded-full" style={{ backgroundColor: activeSeg.slice.color }} />
                    {activeSeg.slice.name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                    <MoneyValue value={activeSeg.slice.total} className="tabular-nums" />
                    <span className="tabular-nums">· {pct(activeSeg.slice.total)}</span>
                  </div>
                </div>
              )}
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
                {segments.map((seg) => (
                  <button
                    key={seg.slice.id}
                    type="button"
                    aria-label={`${seg.slice.name}: ${pct(seg.slice.total)}`}
                    onMouseEnter={() => setHovered(seg.slice.id)}
                    onFocus={() => setHovered(seg.slice.id)}
                    onBlur={() => setHovered(null)}
                    className="h-full cursor-default transition-opacity"
                    style={{
                      width: `${seg.width}%`,
                      backgroundColor: seg.slice.color,
                      opacity: hovered && hovered !== seg.slice.id ? 0.45 : 1,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* legend */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {slices.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 text-sm transition-opacity"
                  style={{ opacity: hovered && hovered !== s.id ? 0.45 : 1 }}
                  onMouseEnter={() => setHovered(s.id)}
                  onMouseLeave={() => setHovered(null)}
                  title={s.name}
                >
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="min-w-0 truncate text-muted-foreground">{s.name}</span>
                  <MoneyValue value={s.total} className="shrink-0 font-medium tabular-nums" />
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{pct(s.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
