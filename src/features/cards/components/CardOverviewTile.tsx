import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
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
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-background p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-cyan-400/50 hover:shadow-[0_16px_50px_-16px_rgba(97,218,251,0.45)]"
    >
      <CardArt card={card} />

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Fatura do mês</p>
          <MoneyValue
            value={card.monthlyTotal}
            className={cn(
              "text-xl font-bold tracking-tight tabular-nums",
              card.monthlyTotal > 0 ? "text-red-500" : "text-muted-foreground"
            )}
          />
        </div>
        {stats.daysUntilDue !== null && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {stats.daysUntilDue === 0 ? "Vence hoje" : `Vence em ${stats.daysUntilDue}d`}
          </span>
        )}
      </div>

      {usedPct !== null && (
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                usedPct >= 90 ? "bg-red-500" : usedPct >= 70 ? "bg-amber-500" : "bg-cyan-500"
              )}
              style={{ width: `${Math.min(usedPct, 100)}%` }}
            />
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            {usedPct}% de <MoneyValue value={card.creditLimit} />
          </p>
        </div>
      )}

      <div className="mt-auto border-t border-border/60 pt-3">
        <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-300 group-hover:text-cyan-500">
          Ver detalhes
          <ChevronRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
