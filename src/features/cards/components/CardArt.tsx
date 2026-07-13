import { cn } from "@/lib/utils"
import type { CardOverview } from "../types"

interface CardArtProps {
  card: Pick<CardOverview, "name" | "color" | "imageUrl" | "logoUrl">
  className?: string
}

// Renders a credit card at real-card proportions (~1.586:1). When the
// user uploaded a card image it fills the frame; otherwise we synthesize a
// bank-like card from the chosen accent color, with a chip and the card's
// name — so every card looks intentional even before an image is added.
export function CardArt({ card, className }: CardArtProps) {
  const color = card.color || "#6B7280"

  return (
    <div
      className={cn(
        "relative aspect-[1.586] w-full overflow-hidden rounded-xl shadow-sm ring-1 ring-black/10",
        className
      )}
    >
      {card.imageUrl ? (
        <img src={card.imageUrl} alt={card.name} className="size-full object-cover" />
      ) : (
        <div
          className="size-full p-4 text-white"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.45) 140%)`,
          }}
        >
          {/* uploaded logo, falling back to a plain chip */}
          {card.logoUrl ? (
            <img
              src={card.logoUrl}
              alt={card.name}
              className="h-8 max-w-[45%] object-contain drop-shadow"
            />
          ) : (
            <div className="h-6 w-8 rounded-md bg-white/70 shadow-inner" />
          )}
          <div className="absolute bottom-4 left-4 right-4">
            <p className="truncate text-lg font-semibold tracking-wide drop-shadow" title={card.name}>
              {card.name}
            </p>
            <p className="mt-1 font-mono text-xs tracking-[0.25em] text-white/80">•••• •••• •••• ••••</p>
          </div>
        </div>
      )}
    </div>
  )
}
