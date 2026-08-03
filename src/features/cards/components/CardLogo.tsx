import { useState } from "react"
import { cn } from "@/lib/utils"
import { bankDomain, brandLogoSrc } from "@/lib/brandLogo"

interface CardLogoProps {
  name: string
  color?: string
  logoUrl?: string
  className?: string
}

export function CardLogo({ name, color, logoUrl, className }: CardLogoProps) {
  const [failed, setFailed] = useState(false)
  const uploaded = Boolean(logoUrl)
  const src = logoUrl || (!failed ? brandLogoSrc(bankDomain(name)) : "")

  if (src) {
    return (
      <span className={cn("block size-9 shrink-0 overflow-hidden rounded-lg", className)}>
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className={cn("size-full object-cover", !uploaded && "scale-[1.45]")}
        />
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
