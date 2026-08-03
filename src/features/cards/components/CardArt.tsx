import { useState } from "react"
import { cn } from "@/lib/utils"
import { bankDomain, brandLogoSrc } from "@/lib/brandLogo"
import type { CardOverview } from "../types"

interface CardArtProps {
  card: Pick<CardOverview, "name" | "color" | "imageUrl" | "logoUrl">
  overlay?: React.ReactNode
  className?: string
}

export function CardArt({ card, overlay, className }: CardArtProps) {
  const color = card.color || "#6B7280"
  const [logoFailed, setLogoFailed] = useState(false)
  const uploaded = Boolean(card.logoUrl)
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
          className="flex size-full flex-col gap-1.5 p-3 text-white @[16rem]:p-4 @container"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, rgba(0,0,0,0.45) 140%)`,
          }}
        >
          {logoSrc ? (
            <span className="inline-block size-8 shrink-0 overflow-hidden rounded-md drop-shadow-md">
              <img
                src={logoSrc}
                alt={card.name}
                onError={() => setLogoFailed(true)}
                className={cn("size-full object-cover", !uploaded && "scale-[1.45]")}
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
        <div className="absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/75 via-black/25 to-transparent p-3 pt-8 text-white @[16rem]:p-4 @[16rem]:pt-12">
          {overlay}
        </div>
      )}
    </div>
  )
}
