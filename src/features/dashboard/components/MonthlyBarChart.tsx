import { useState } from "react"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"
import type { MonthlyPoint, SeriesMeta } from "../recurrences"

interface MonthlyBarChartProps {
  data: MonthlyPoint[]
  // Only the series the user has toggled on are passed in.
  series: SeriesMeta[]
  // Month (0-based) to visually emphasize — e.g. the current month.
  highlightIndex?: number
}

function compact(value: number): string {
  if (value >= 1000) {
    const k = value / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`
  }
  return String(Math.round(value))
}

// A grouped monthly bar chart built with plain elements (no chart lib):
// horizontal gridlines, one column per month, hover reveals a tooltip with
// each series' value and the month total.
export function MonthlyBarChart({ data, series, highlightIndex }: MonthlyBarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const max = Math.max(
    1,
    ...data.flatMap((p) => series.map((s) => p[s.key])).filter((v) => Number.isFinite(v))
  )
  // Round the axis top up to a "nice" value so gridlines read cleanly.
  const step = niceStep(max / 4)
  const axisTop = step * 4
  const gridValues = [4, 3, 2, 1, 0].map((i) => step * i)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {/* y-axis labels */}
        <div className="flex h-56 flex-col justify-between py-1 text-right text-[10px] text-muted-foreground">
          {gridValues.map((v, i) => (
            <span key={i}>{compact(v)}</span>
          ))}
        </div>

        {/* plot area */}
        <div className="relative flex-1">
          {/* gridlines */}
          <div className="absolute inset-0 flex h-56 flex-col justify-between">
            {gridValues.map((_, i) => (
              <div key={i} className="border-t border-dashed border-border/60" />
            ))}
          </div>

          {/* columns */}
          <div className="relative flex h-56 items-end">
            {data.map((point, index) => {
              const total = series.reduce((sum, s) => sum + point[s.key], 0)
              const isHovered = hovered === index
              return (
                <div
                  key={point.label}
                  className="group relative flex h-full flex-1 items-end justify-center"
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered((h) => (h === index ? null : h))}
                >
                  {/* hover backdrop + current-month emphasis */}
                  <div
                    className={cn(
                      "absolute inset-x-0.5 bottom-0 top-0 rounded-t-md transition-colors",
                      isHovered ? "bg-muted/60" : highlightIndex === index ? "bg-muted/30" : "bg-transparent"
                    )}
                  />
                  <div className="relative flex h-full items-end justify-center gap-[3px] px-1">
                    {series.map((s) => (
                      <div
                        key={s.key}
                        className={cn("w-1.5 rounded-t-sm transition-all sm:w-2", s.color, isHovered ? "opacity-100" : "opacity-90")}
                        style={{ height: `${Math.max((point[s.key] / axisTop) * 100, point[s.key] > 0 ? 2 : 0)}%` }}
                      />
                    ))}
                  </div>

                  {isHovered && total > 0 && (
                    <div className="pointer-events-none absolute bottom-full z-10 mb-1 w-40 -translate-x-1/2 left-1/2 rounded-lg border bg-popover p-2 text-xs shadow-md">
                      <p className="mb-1 font-medium">{point.label}</p>
                      {series.map((s) => (
                        <div key={s.key} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className={cn("size-2 rounded-full", s.color)} />
                            {s.label}
                          </span>
                          <span className="tabular-nums">{formatMoney(point[s.key])}</span>
                        </div>
                      ))}
                      <div className="mt-1 flex justify-between border-t pt-1 font-medium">
                        <span>Total</span>
                        <span className="tabular-nums">{formatMoney(total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* x-axis labels */}
      <div className="flex pl-8">
        {data.map((point, index) => (
          <span
            key={point.label}
            className={cn(
              "flex-1 text-center text-[10px]",
              highlightIndex === index ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// Rounds an approximate step up to 1/2/5 × 10ⁿ so axis labels are tidy.
function niceStep(approx: number): number {
  if (approx <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(approx)))
  const norm = approx / pow
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return nice * pow
}
