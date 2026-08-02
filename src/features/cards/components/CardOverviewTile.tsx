import { Link } from "react-router-dom"
import { MoneyValue } from "@/components/MoneyValue"
import { useMonthStore } from "@/lib/monthStore"
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
  const month = useMonthStore((s) => s.month)
  const stats = computeCardStats(card, month)

  return (
    <Link
      to={`/cards/${card.id}`}
      viewTransition
      className="group block rounded-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_20px_50px_-16px_rgba(97,218,251,0.5)]"
    >
      <CardArt
        card={card}
        overlay={
          <div className="w-full">
            <MoneyValue
              value={card.monthlyTotal}
              className="block whitespace-nowrap text-lg font-bold leading-none tabular-nums drop-shadow @[12rem]:text-xl"
            />
            {stats.daysUntilDue !== null && (
              <p className="mt-1 hidden truncate text-[11px] font-medium text-white/75 @[12rem]:block">
                {stats.daysUntilDue === 0
                  ? "Vence hoje"
                  : `Vence em ${stats.daysUntilDue} ${stats.daysUntilDue === 1 ? "dia" : "dias"}`}
              </p>
            )}
          </div>
        }
      />
    </Link>
  )
}
