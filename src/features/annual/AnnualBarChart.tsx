import { useState } from "react"
import { formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"
import { useVisibilityStore } from "@/lib/visibility-store"
import type { AnnualMonth } from "./useAnnualData"

export function AnnualBarChart({ months, highlightIndex }: { months: AnnualMonth[]; highlightIndex?: number }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const hidden = useVisibilityStore((s) => s.hidden)

  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]))
  const step = niceStep(max / 4)
  const axisTop = step * 4
  const gridValues = [4, 3, 2, 1, 0].map((i) => step * i)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="flex h-56 flex-col justify-between py-1 text-right text-[10px] text-muted-foreground">
          {gridValues.map((v, i) => (
            <span key={i}>{hidden ? "•••" : compact(v)}</span>
          ))}
        </div>

        <div className="relative flex-1">
          <div className="absolute inset-0 flex h-56 flex-col justify-between">
            {gridValues.map((_, i) => (
              <div key={i} className="border-t border-dashed border-border/60" />
            ))}
          </div>

          <div className="relative flex h-56 items-end">
            {months.map((m, index) => {
              const isHovered = hovered === index
              return (
                <div
                  key={m.label}
                  className="group relative flex h-full flex-1 items-end justify-center"
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered((h) => (h === index ? null : h))}
                >
                  <div
                    className={cn(
                      "absolute inset-x-0.5 bottom-0 top-0 rounded-t-md transition-colors",
                      isHovered ? "bg-muted/60" : highlightIndex === index ? "bg-muted/30" : "bg-transparent"
                    )}
                  />
                  <div className="relative flex h-full items-end justify-center gap-[3px] px-1">
                    <div
                      className={cn("w-1.5 rounded-t-sm bg-emerald-500 transition-all sm:w-2.5", isHovered ? "opacity-100" : "opacity-90")}
                      style={{ height: `${Math.max((m.income / axisTop) * 100, m.income > 0 ? 2 : 0)}%` }}
                    />
                    <div
                      className={cn("w-1.5 rounded-t-sm bg-red-500 transition-all sm:w-2.5", isHovered ? "opacity-100" : "opacity-90")}
                      style={{ height: `${Math.max((m.expense / axisTop) * 100, m.expense > 0 ? 2 : 0)}%` }}
                    />
                  </div>

                  {isHovered && (m.income > 0 || m.expense > 0) && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-44 -translate-x-1/2 rounded-lg border bg-popover p-2 text-xs shadow-md">
                      <p className="mb-1 font-medium">{m.label}</p>
                      <Row color="bg-emerald-500" label="Entradas" value={m.income} />
                      <Row color="bg-red-500" label="Saídas" value={m.expense} />
                      <div className="mt-1 flex justify-between border-t pt-1 font-medium">
                        <span>Saldo</span>
                        <span className={cn("tabular-nums", m.net < 0 ? "text-red-500" : "text-emerald-500")}>
                          {formatMoney(m.net)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex pl-8">
        {months.map((m, index) => (
          <span
            key={m.label}
            className={cn(
              "flex-1 text-center text-[10px]",
              highlightIndex === index ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function Row({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className={cn("size-2 rounded-full", color)} />
        {label}
      </span>
      <span className="tabular-nums">{formatMoney(value)}</span>
    </div>
  )
}

function compact(value: number): string {
  if (value >= 1000) {
    const k = value / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`
  }
  return String(Math.round(value))
}

function niceStep(approx: number): number {
  if (approx <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(approx)))
  const norm = approx / pow
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return nice * pow
}
