import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { MoneyValue } from "@/components/MoneyValue"
import { CardArt } from "./CardArt"
import { computeCardStats } from "../cardStats"
import type { CardOverview } from "../types"

interface CardOverviewTileProps {
  card: CardOverview
}

// One card in the overview grid — deliberately minimal: the card visual, the
// month's bill, a thin limit-usage bar and a due-date hint. Deeper stats
// (flags, ending installments, subscriptions) live on the detail page. Styled
// like the accounts "connection" tiles: on hover it lifts, zooms slightly and
// gets a soft blue glow. The whole tile links to the card's detail page.
export function CardOverviewTile({ card }: CardOverviewTileProps) {
  const stats = computeCardStats(card)
  const usedPct = stats.limitUsedFraction === null ? null : Math.round(stats.limitUsedFraction * 100)

  return (
    <Link
      to={`/cards/${card.id}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-card to-background p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-white/60 hover:shadow-[0_16px_50px_-16px_rgba(255,255,255,0.35)]"
    >
      <CardArt card={card} />

      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
        <MoneyValue value={card.monthlyTotal} className="min-w-0 text-lg font-bold tracking-tight tabular-nums" />
        {stats.daysUntilDue !== null && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {stats.daysUntilDue === 0
              ? "Vence hoje"
              : `Vence em ${stats.daysUntilDue} ${stats.daysUntilDue === 1 ? "dia" : "dias"}`}
          </span>
        )}
      </div>

      {usedPct !== null && (
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-red-500"
              style={{ width: `${Math.min(usedPct, 100)}%` }}
            />
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            {usedPct}% de <MoneyValue value={card.creditLimit} />
          </p>
        </div>
      )}

      <div className="mt-auto border-t border-border/60 pt-2.5">
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
          Ver detalhes
          <ChevronRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
