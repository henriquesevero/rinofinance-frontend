import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { currentMonth, monthLabel, useMonthStore } from "@/lib/monthStore"

interface MonthSelectorProps {
  className?: string
}

export function MonthSelector({ className }: MonthSelectorProps) {
  const month = useMonthStore((s) => s.month)
  const shift = useMonthStore((s) => s.shift)
  const goToCurrent = useMonthStore((s) => s.goToCurrent)
  const atCurrent = month === currentMonth()

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Período</span>
      <div className="flex items-center gap-1 rounded-md border bg-card px-0.5 py-0.5">
        <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => shift(-1)} aria-label="Mês anterior">
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-0 flex-1 truncate text-center text-sm font-medium">{monthLabel(month)}</span>
        <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => shift(1)} aria-label="Próximo mês">
          <ChevronRight className="size-4" />
        </Button>
      </div>
      {!atCurrent && (
        <button
          type="button"
          onClick={goToCurrent}
          className="px-1 text-left text-xs font-medium text-primary hover:underline"
        >
          Voltar ao mês atual
        </button>
      )}
    </div>
  )
}
