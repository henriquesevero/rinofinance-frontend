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
        className={cn("size-full rounded-2xl object-contain", className)}
      />
    )
  }

  return (
    <div className={cn("flex size-full items-center justify-center rounded-2xl bg-muted text-4xl font-semibold text-muted-foreground", className)}>
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  )
}
