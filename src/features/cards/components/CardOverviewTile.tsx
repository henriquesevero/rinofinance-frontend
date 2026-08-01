import { Link } from "react-router-dom"
import { MoneyValue } from "@/components/MoneyValue"
import { CardArt } from "./CardArt"
import { computeCardStats } from "../cardStats"
import type { CardOverview } from "../types"

interface CardOverviewTileProps {
  card: CardOverview
}

// One card in the overview grid — just the card itself (no surrounding frame),
// with the month's bill laid over it Wallet-style. Deeper stats (limit usage,
// flags, subscriptions) live on the detail page. On hover it lifts, zooms
// slightly and gets a soft blue glow. The whole card links to its detail page.
export function CardOverviewTile({ card }: CardOverviewTileProps) {
  const stats = computeCardStats(card)

  return (
    <Link
      to={`/cards/${card.id}`}
      className="group block rounded-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_20px_50px_-16px_rgba(97,218,251,0.5)]"
    >
      <CardArt
        card={card}
        overlay={
          <div className="w-full">
            <MoneyValue
              value={card.monthlyTotal}
              className="block whitespace-nowrap text-base font-bold leading-tight tabular-nums drop-shadow @[12rem]:text-lg"
            />
            <p className="truncate text-[10px] font-medium text-white/70">
              Fatura do mês
              {stats.daysUntilDue !== null &&
                ` · ${
                  stats.daysUntilDue === 0
                    ? "vence hoje"
                    : `vence em ${stats.daysUntilDue} ${stats.daysUntilDue === 1 ? "dia" : "dias"}`
                }`}
            </p>
          </div>
        }
      />
    </Link>
  )
}
