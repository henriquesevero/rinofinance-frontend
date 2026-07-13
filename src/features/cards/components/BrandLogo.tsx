import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const LOGODEV_TOKEN = import.meta.env.VITE_LOGODEV_TOKEN

interface BrandLogoProps {
  domain?: string
  fallbackIcon: LucideIcon
  className?: string
}

// Fetches a merchant/service's brand logo from logo.dev by domain (e.g.
// "netflix.com" -> the Netflix logo), so purchases and subscriptions show
// their real brand icon instead of a generic one. Falls back to the given
// icon when there's no domain, no token configured, or the image fails
// to load (unknown domain, network error, etc).
export function BrandLogo({ domain, fallbackIcon: FallbackIcon, className }: BrandLogoProps) {
  const [failed, setFailed] = useState(false)
  const trimmedDomain = domain?.trim()

  if (!trimmedDomain || !LOGODEV_TOKEN || failed) {
    return <FallbackIcon className={cn("size-4 text-muted-foreground", className)} />
  }

  return (
    <img
      src={`https://img.logo.dev/${trimmedDomain}?token=${LOGODEV_TOKEN}&size=32`}
      alt={trimmedDomain}
      className={cn("size-4 shrink-0 rounded-sm object-contain", className)}
      onError={() => setFailed(true)}
    />
  )
}
