import { MoneyValue } from "@/components/MoneyValue"

interface Segment {
  color: string
  value: number
}

// A portfolio-allocation donut: each active asset is an arc sized by its share
// of the total, with the total patrimony in the middle. Pure SVG, no library —
// the circumference is ~100 so each arc's dash length equals its percentage.
export function AllocationDonut({
  segments,
  total,
  label = "Patrimônio",
}: {
  segments: Segment[]
  total: number
  label?: string
}) {
  const r = 15.915
  let offset = 25 // start at 12 o'clock
  const arcs = segments.map((s) => {
    const pct = total > 0 ? (s.value / total) * 100 : 0
    const arc = { color: s.color, dash: pct, gap: 100 - pct, offset }
    offset -= pct
    return arc
  })

  return (
    <div className="relative mx-auto size-40 shrink-0 sm:size-44">
      <svg viewBox="0 0 42 42" className="size-full">
        <circle cx="21" cy="21" r={r} fill="none" className="stroke-muted" strokeWidth="4" />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx="21"
            cy="21"
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth="4"
            strokeDasharray={`${a.dash} ${a.gap}`}
            strokeDashoffset={a.offset}
            transform="rotate(-90 21 21)"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <MoneyValue value={total} className="text-sm font-bold leading-tight tabular-nums" />
      </div>
    </div>
  )
}
