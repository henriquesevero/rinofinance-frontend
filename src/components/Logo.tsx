import { useId } from "react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showWordmark?: boolean
  markClassName?: string
}

// Brand mark: an upward growth trend line with an arrowhead — a clear
// finance/"crescimento" symbol — on a dark rounded-square badge, in React
// blue with a soft glow. The identity stays fixed across themes; the
// wordmark uses the theme foreground. public/favicon.svg mirrors this.
export function Logo({ className, showWordmark = true, markClassName }: LogoProps) {
  const id = useId()
  const bgId = `${id}-bg`
  const lineId = `${id}-line`
  const glowId = `${id}-glow`
  const blurId = `${id}-blur`

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg viewBox="0 0 40 40" className={cn("size-8 shrink-0", markClassName)} aria-hidden="true">
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A2B36" />
            <stop offset="100%" stopColor="#15151C" />
          </linearGradient>
          <linearGradient id={lineId} gradientUnits="userSpaceOnUse" x1="8" y1="27" x2="31" y2="12">
            <stop offset="0%" stopColor="#2AA6C9" />
            <stop offset="55%" stopColor="#61DAFB" />
            <stop offset="100%" stopColor="#9EEBFF" />
          </linearGradient>
          <radialGradient id={glowId} cx="66%" cy="34%" r="60%">
            <stop offset="0%" stopColor="#61DAFB" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#61DAFB" stopOpacity="0" />
          </radialGradient>
          <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        {/* Dark rounded-square badge */}
        <rect width="40" height="40" rx="11" fill={`url(#${bgId})`} />
        <rect x="0.6" y="0.6" width="38.8" height="38.8" rx="10.6" fill="none" stroke="#ffffff" strokeOpacity="0.06" />

        {/* Blue glow near the rising tip */}
        <ellipse cx="27" cy="15" rx="12" ry="11" fill={`url(#${glowId})`} filter={`url(#${blurId})`} />

        {/* Upward trend line + arrowhead */}
        <g
          fill="none"
          stroke={`url(#${lineId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 27 L 16.5 20 L 22 24 L 31 13" />
          <path d="M24 12.5 L 31 12.5 L 31 19.5" />
        </g>
      </svg>
      {showWordmark && <span className="text-lg font-semibold tracking-tight">RinoFinance</span>}
    </div>
  )
}
