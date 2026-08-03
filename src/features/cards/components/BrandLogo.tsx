import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { brandLogoSrc } from "@/lib/brandLogo"

interface BrandLogoProps {
  domain?: string
  fallbackIcon: LucideIcon
  className?: string
  size?: number
}

export function BrandLogo({ domain, fallbackIcon: FallbackIcon, className, size = 32 }: BrandLogoProps) {
  const [failed, setFailed] = useState(false)
  const trimmedDomain = domain?.trim()

  if (!trimmedDomain || failed) {
    return <FallbackIcon className={cn("size-4 text-muted-foreground", className)} />
  }

  const src = brandLogoSrc(trimmedDomain, size)

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
