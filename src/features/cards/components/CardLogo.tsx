import { useState } from "react"
import { cn } from "@/lib/utils"
import { bankDomain, brandLogoSrc } from "@/lib/brandLogo"

interface CardLogoProps {
  name: string
  color?: string
  logoUrl?: string
  className?: string
}

// Shows the card's logo: an uploaded image if set, else the bank's brand
// logo auto-detected from the card name (e.g. "Nubank" → Nubank logo), else
// a badge in the card's color with its first letter.
export function CardLogo({ name, color, logoUrl, className }: CardLogoProps) {
  const [failed, setFailed] = useState(false)
  const src = logoUrl || (!failed ? brandLogoSrc(bankDomain(name)) : "")

  if (src) {
    // Zoom the brand icon slightly inside a clipped, rounded frame so it fills
    // completely — Brandfetch icons carry padding and some sit on a white
    // plate; this removes any white border.
    return (
      <span className={cn("block size-9 shrink-0 overflow-hidden rounded-lg", className)}>
        <img src={src} alt={name} onError={() => setFailed(true)} className="size-full scale-[1.34] object-cover" />
      </span>
    )
  }

  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white",
        className
      )}
      style={{ backgroundColor: color || "#6B7280" }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  )
}
