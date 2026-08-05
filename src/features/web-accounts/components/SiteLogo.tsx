import { useState } from "react"
import { cn } from "@/lib/utils"
import { brandLogoSrc, normalizeDomain } from "@/lib/brandLogo"

interface SiteLogoProps {
  name: string
  url?: string
  imageUrl?: string
  className?: string
}

export function SiteLogo({ name, url, imageUrl, className }: SiteLogoProps) {
  const [failed, setFailed] = useState(false)
  const src = imageUrl || (!failed ? brandLogoSrc(normalizeDomain(url ?? ""), 256) : "")

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn("size-full rounded-[26%] object-cover shadow-sm", className)}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex size-full items-center justify-center rounded-[26%] bg-muted text-4xl font-semibold text-muted-foreground shadow-sm",
        className
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  )
}
