import { useState } from "react"
import { cn } from "@/lib/utils"
import { bankDomain, brandLogoSrc } from "@/lib/brandLogo"
import type { CardOverview } from "../types"

interface CardArtProps {
  card: Pick<CardOverview, "name" | "color" | "imageUrl" | "logoUrl">
  className?: string
}

// Renders a credit card at real-card proportions (~1.586:1). When the
// user uploaded a card image it fills the frame; otherwise we synthesize a
// bank-like card from the chosen accent color, with the bank's brand logo
// (auto-detected from the name) and the card's name.
export function CardArt({ card, className }: CardArtProps) {
  const color = card.color || "#6B7280"
  const [logoFailed, setLogoFailed] = useState(false)
  const logoSrc = card.logoUrl || (!logoFailed ? brandLogoSrc(bankDomain(card.name)) : "")

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
          {/* brand logo (uploaded or auto-detected), else a plain chip */}
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={card.name}
              onError={() => setLogoFailed(true)}
              className="h-9 max-w-[55%] rounded-md object-contain drop-shadow-md"
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
