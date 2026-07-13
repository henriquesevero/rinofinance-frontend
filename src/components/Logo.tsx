import { useId } from "react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showWordmark?: boolean
  markClassName?: string
}

// Brand mark: a grooved gold ring with a large ornate serif "$" struck
// through it and a soft highlight in the upper right — echoing a minted
// medallion. Solid black badge behind so the ring's dark interior reads
// as a hole, not a filled disc. The black-and-gold identity stays fixed
// across themes (a logo shouldn't change per theme), while the wordmark
// next to it uses the current theme's foreground color. The standalone
// favicon (public/favicon.svg) mirrors this same artwork.
export function Logo({ className, showWordmark = true, markClassName }: LogoProps) {
  const id = useId()
  const gradientId = `${id}-gold`
  const glowId = `${id}-glow`
  const blurId = `${id}-blur`

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg viewBox="0 0 40 40" className={cn("size-8 shrink-0", markClassName)} aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="10" y1="6" x2="30" y2="34">
            <stop offset="0%" stopColor="#FCEFC4" />
            <stop offset="45%" stopColor="#E8B93B" />
            <stop offset="100%" stopColor="#9C6E0B" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE9A8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFE9A8" stopOpacity="0" />
          </radialGradient>
          <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.3" />
          </filter>
        </defs>

        <rect width="40" height="40" rx="10" fill="#0A0A0A" />

        {/* Highlight, upper right */}
        <circle cx="29" cy="10" r="3.6" fill={`url(#${glowId})`} filter={`url(#${blurId})`} />

        {/* Grooved ring */}
        <circle cx="20" cy="20" r="13.4" fill="none" stroke={`url(#${gradientId})`} strokeWidth="2.8" />
        <circle cx="20" cy="20" r="12" fill="none" stroke="#7A5C0A" strokeWidth="0.5" opacity="0.7" />

        {/* Ornate serif dollar sign */}
        <text
          x="20"
          y="29"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="27"
          fontWeight="700"
          fill={`url(#${gradientId})`}
        >
          $
        </text>
      </svg>
      {showWordmark && <span className="text-lg font-semibold tracking-tight">RinoFinance</span>}
    </div>
  )
}
