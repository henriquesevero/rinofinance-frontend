import { cn } from "@/lib/utils"

interface CardLogoProps {
  name: string
  color?: string
  logoUrl?: string
  className?: string
}

// Shows the card's uploaded logo when set, falling back to a badge in
// the card's chosen color with its first letter — mirroring UserAvatar's
// pattern so every "brand mark" in the app behaves consistently.
export function CardLogo({ name, color, logoUrl, className }: CardLogoProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={cn("size-9 shrink-0 rounded-lg object-cover", className)}
      />
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
