import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { brandLogoSrc } from "@/lib/brandLogo"

interface BrandLogoProps {
  domain?: string
  fallbackIcon: LucideIcon
  className?: string
  // Pixel resolution fetched from Brandfetch (bump it for larger displays).
  size?: number
}

// Fetches a merchant/service's brand icon from Brandfetch by domain (e.g.
// "netflix.com" -> the Netflix icon), so purchases and subscriptions show
// their real brand icon instead of a generic one. Falls back to the given
// icon when there's no domain or the image fails to load (unknown brand
// returns HTTP 404, network error, etc).
export function BrandLogo({ domain, fallbackIcon: FallbackIcon, className, size = 32 }: BrandLogoProps) {
  const [failed, setFailed] = useState(false)
  const trimmedDomain = domain?.trim()

  if (!trimmedDomain || failed) {
    return <FallbackIcon className={cn("size-4 text-muted-foreground", className)} />
  }

  const src = brandLogoSrc(trimmedDomain, size)

  // Zoom slightly inside a clipped, rounded frame so the icon fills the frame
  // with no white border (Brandfetch icons carry padding / white plates).
  return (
    <span className={cn("inline-flex size-4 shrink-0 overflow-hidden rounded-sm", className)}>
      <img
        src={src}
        alt={trimmedDomain}
        className="size-full scale-[1.45] object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  )
}
