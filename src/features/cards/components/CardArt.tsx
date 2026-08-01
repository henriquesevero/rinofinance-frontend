import { useState } from "react"
import { cn } from "@/lib/utils"
import { bankDomain, brandLogoSrc } from "@/lib/brandLogo"
import type { CardOverview } from "../types"

interface CardArtProps {
  card: Pick<CardOverview, "name" | "color" | "imageUrl" | "logoUrl">
  // Optional Wallet-style content laid over the bottom of the card (e.g. the
  // month's bill), on a gradient scrim for legibility over any background.
  overlay?: React.ReactNode
  className?: string
}

// Renders a credit card at real-card proportions (~1.586:1). When the
// user uploaded a card image it fills the frame; otherwise we synthesize a
// bank-like card from the chosen accent color, with the bank's brand logo
// (auto-detected from the name) and the card's name.
export function CardArt({ card, overlay, className }: CardArtProps) {
  const color = card.color || "#6B7280"
  const [logoFailed, setLogoFailed] = useState(false)
  const logoSrc = card.logoUrl || (!logoFailed ? brandLogoSrc(bankDomain(card.name)) : "")

  return (
    <div
      className={cn(
        "relative aspect-[1.586] w-full overflow-hidden rounded-xl shadow-sm ring-1 ring-black/10 @container",
        className
      )}
    >
      {card.imageUrl ? (
        <img src={card.imageUrl} alt={card.name} className="size-full object-cover" />
      ) : (
        <div
          className="flex size-full flex-col gap-1.5 p-3 text-white @container"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.45) 140%)`,
          }}
        >
          {/* brand logo (uploaded or auto-detected), else a plain chip */}
          {logoSrc ? (
            <span className="inline-block size-8 shrink-0 overflow-hidden rounded-md drop-shadow-md">
              <img
                src={logoSrc}
                alt={card.name}
                onError={() => setLogoFailed(true)}
                className="size-full scale-[1.45] object-cover"
              />
            </span>
          ) : (
            <div className="h-5 w-7 shrink-0 rounded-md bg-white/70 shadow-inner" />
          )}
          <p className="truncate text-sm font-semibold tracking-wide drop-shadow @[13rem]:text-base" title={card.name}>
            {card.name}
          </p>
        </div>
      )}

      {overlay && (
        <div className="absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/75 via-black/25 to-transparent p-3 pt-10 text-white">
          {overlay}
        </div>
      )}
    </div>
  )
}
