import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { brandLogoSrc } from "@/lib/brandLogo"

interface BrandLogoProps {
  domain?: string
  fallbackIcon: LucideIcon
  className?: string
  // Pixel resolution fetched from logo.dev (bump it for larger displays).
  size?: number
}

// Fetches a merchant/service's brand logo from logo.dev by domain (e.g.
// "netflix.com" -> the Netflix logo), so purchases and subscriptions show
// their real brand icon instead of a generic one. Falls back to the given
// icon when there's no domain, no token configured, or the image fails
// to load (unknown domain, network error, etc).
export function BrandLogo({ domain, fallbackIcon: FallbackIcon, className, size = 32 }: BrandLogoProps) {
  const [failed, setFailed] = useState(false)
  const trimmedDomain = domain?.trim()

  if (!trimmedDomain || failed) {
    return <FallbackIcon className={cn("size-4 text-muted-foreground", className)} />
  }

  const src = brandLogoSrc(trimmedDomain, size)

  return (
    <img
      src={src}
      alt={trimmedDomain}
      className={cn("size-4 shrink-0 rounded-sm object-contain", className)}
      onError={() => setFailed(true)}
    />
  )
}
