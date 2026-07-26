import { Link } from "react-router-dom"
import { CalendarClock, ChevronRight, Flag, Hourglass, Repeat } from "lucide-react"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { CardArt } from "./CardArt"
import { computeCardStats } from "../cardStats"
import type { CardOverview } from "../types"

interface CardOverviewTileProps {
  card: CardOverview
}

// One card in the overview grid: the card visual plus its month total,
// limit usage, due-date countdown and quick status badges. Styled like the
// accounts "connection" tiles — on hover it lifts, zooms slightly and gets a
// soft blue glow. The whole tile links to the card's detail page.
export function CardOverviewTile({ card }: CardOverviewTileProps) {
  const stats = computeCardStats(card)
  const usedPct = stats.limitUsedFraction === null ? null : Math.round(stats.limitUsedFraction * 100)

  return (
    <Link
      to={`/cards/${card.id}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-background p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-cyan-400/50 hover:shadow-[0_16px_50px_-16px_rgba(97,218,251,0.45)]"
    >
      <CardArt card={card} />

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted-foreground">Fatura do mês</span>
          <MoneyValue value={card.monthlyTotal} className="text-lg font-semibold tabular-nums" />
        </div>

        {usedPct !== null && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Limite usado</span>
              <span className="tabular-nums">{usedPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  usedPct >= 90 ? "bg-red-500" : usedPct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(usedPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <MoneyValue value={card.monthlyTotal} />
              <span>
                de <MoneyValue value={card.creditLimit} />
              </span>
            </div>
          </div>
        )}

        {/* status badges */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {stats.daysUntilDue !== null && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <CalendarClock className="size-3.5" />
              {stats.daysUntilDue === 0 ? "Vence hoje" : `Vence em ${stats.daysUntilDue}d`}
            </span>
          )}
          {stats.flaggedCount > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <Flag className="size-3.5 fill-red-500" />
              {stats.flaggedCount} em atenção
            </span>
          )}
          {stats.endingThisMonthCount > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Hourglass className="size-3.5" />
              {stats.endingThisMonthCount} terminando
            </span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground">
            <Repeat className="size-3.5" />
            {stats.subscriptionCount} assinatura{stats.subscriptionCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="mt-auto border-t border-border/60 pt-3">
        <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-300 group-hover:text-cyan-500">
          Ver detalhes
          <ChevronRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
