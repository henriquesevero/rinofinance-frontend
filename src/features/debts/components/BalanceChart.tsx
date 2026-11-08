import { useRef, useState, type PointerEvent } from "react"
import { formatMoney } from "@/lib/money"
import { useVisibilityStore } from "@/lib/visibility-store"
import { cn } from "@/lib/utils"
import { monthYear } from "../amortization"

const BASELINE_COLOR = "text-[#d9730d]"
const PLAN_COLOR = "text-[#2f72c4] dark:text-[#4a8fdc]"

interface BalanceChartProps {
  today: string
  dates: string[]
  baseline: number[]
  simulated: number[]
}

export function BalanceChart({ today, dates, baseline, simulated }: BalanceChartProps) {
  const hidden = useVisibilityStore((s) => s.hidden)
  const plotRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  const labels = [today, ...dates]
  const lastIndex = baseline.length - 1
  const step = niceStep(baseline[0] / 4)
  const axisTop = step * Math.ceil(baseline[0] / step)
  const gridValues = Array.from({ length: Math.round(axisTop / step) + 1 }, (_, i) => axisTop - step * i)

  const x = (i: number) => (i / lastIndex) * 100
  const y = (v: number) => 100 - (v / axisTop) * 100
  const points = (values: number[]) => values.map((v, i) => `${x(i)},${y(v)}`).join(" ")

  const planEnd = simulated.findIndex((v) => v === 0)
  const showPlanEnd = planEnd > 0 && planEnd < lastIndex
  const tickCount = Math.min(5, lastIndex + 1)
  const ticks = Array.from({ length: tickCount }, (_, i) => Math.round((i / (tickCount - 1)) * lastIndex))

  function handlePointer(event: PointerEvent<HTMLDivElement>) {
    const rect = plotRef.current?.getBoundingClientRect()
    if (!rect) return
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    setHovered(Math.round(ratio * lastIndex))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <LegendKey className={BASELINE_COLOR} label="Sem antecipar" />
        <LegendKey className={PLAN_COLOR} label="Com a simulação" />
      </div>

      <div className="flex gap-2">
        <div className="flex h-48 w-10 shrink-0 flex-col justify-between text-right text-[10px] leading-none text-muted-foreground">
          {gridValues.map((v) => (
            <span key={v}>{hidden ? "•••" : compact(v)}</span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div
            ref={plotRef}
            className="relative h-48 touch-pan-y"
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={() => setHovered(null)}
            role="img"
            aria-label={`Saldo a pagar projetado até ${monthYear(labels[lastIndex])}`}
          >
            {gridValues.map((v) => (
              <div key={v} className="absolute inset-x-0 border-t border-border/70" style={{ top: `${y(v)}%` }} />
            ))}

            <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                className={BASELINE_COLOR}
                points={points(baseline)}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                className={PLAN_COLOR}
                points={points(simulated)}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {showPlanEnd && hovered === null && (
              <>
                <Dot className={PLAN_COLOR} left={x(planEnd)} top={100} />
                <span
                  className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded bg-card px-1 text-[11px] font-medium"
                  style={{ left: `${Math.min(84, Math.max(16, x(planEnd)))}%`, bottom: 14 }}
                >
                  Termina em {monthYear(labels[planEnd])}
                </span>
              </>
            )}

            {hovered !== null && (
              <>
                <div className="absolute inset-y-0 w-px bg-border" style={{ left: `${x(hovered)}%` }} />
                <Dot className={BASELINE_COLOR} left={x(hovered)} top={y(baseline[hovered])} />
                <Dot className={PLAN_COLOR} left={x(hovered)} top={y(simulated[hovered])} />
                <div
                  className="pointer-events-none absolute top-0 z-10 w-52 -translate-x-1/2 rounded-lg border bg-popover p-2 text-xs shadow-md"
                  style={{ left: `${Math.min(76, Math.max(24, x(hovered)))}%` }}
                >
                  <p className="mb-1 font-semibold">{hovered === 0 ? "Hoje" : monthYear(labels[hovered])}</p>
                  <TooltipRow className={BASELINE_COLOR} label="Sem antecipar" value={baseline[hovered]} hidden={hidden} />
                  <TooltipRow className={PLAN_COLOR} label="Simulação" value={simulated[hovered]} hidden={hidden} />
                </div>
              </>
            )}
          </div>

          <div className="relative mt-1.5 h-4 text-[10px] text-muted-foreground">
            {ticks.map((tick, i) => (
              <span
                key={tick}
                className={cn(
                  "absolute whitespace-nowrap",
                  i === 0 ? "left-0" : i === ticks.length - 1 ? "right-0" : "-translate-x-1/2"
                )}
                style={i === 0 || i === ticks.length - 1 ? undefined : { left: `${x(tick)}%` }}
              >
                {tick === 0 ? "Hoje" : monthYear(labels[tick])}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LegendKey({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-0.5 w-4 rounded-full bg-current", className)} />
      <span>{label}</span>
    </span>
  )
}

function Dot({ className, left, top }: { className: string; left: number; top: number }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-card",
        className
      )}
      style={{ left: `${left}%`, top: `${top}%` }}
    />
  )
}

function TooltipRow({
  className,
  label,
  value,
  hidden,
}: {
  className: string
  label: string
  value: number
  hidden: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("size-2 shrink-0 rounded-full bg-current", className)} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium tabular-nums">{hidden ? "•••" : formatMoney(value)}</span>
    </div>
  )
}

function niceStep(raw: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(raw, 1)))
  const normalized = raw / magnitude
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

function compact(value: number): string {
  if (value >= 1000) return `${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
  return String(Math.round(value))
}
