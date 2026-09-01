import { useEffect, useRef, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react"
import { Card } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"

interface SummaryCardsProps {
  totalIncome: number
  totalExpense: number
  netBalance: number
}

export function SummaryCards({ totalIncome, totalExpense, netBalance }: SummaryCardsProps) {
  const projectedPositive = netBalance >= 0

  const [celebrate, setCelebrate] = useState(false)
  const prevPositive = useRef(projectedPositive)
  useEffect(() => {
    if (projectedPositive && !prevPositive.current) {
      setCelebrate(true)
      const t = setTimeout(() => setCelebrate(false), 1200)
      prevPositive.current = projectedPositive
      return () => clearTimeout(t)
    }
    prevPositive.current = projectedPositive
  }, [projectedPositive])

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="grid grid-cols-3 gap-px bg-border">
        <div className={cn("flex flex-col gap-0.5 bg-card p-4 sm:gap-1 sm:p-5", celebrate && "rf-celebrate")}>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Scale className={cn("size-3.5 shrink-0", projectedPositive ? "text-emerald-500" : "text-red-500")} />
            <span className="truncate">Saldo</span>
          </span>
          <MoneyValue
            value={netBalance}
            className={cn(
              "truncate text-xl font-bold tracking-tight tabular-nums sm:text-2xl",
              projectedPositive ? "text-emerald-500" : "text-red-500"
            )}
          />
        </div>

        <div className="flex flex-col gap-0.5 bg-card p-4 sm:gap-1 sm:p-5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <ArrowDownLeft className="size-3.5 shrink-0 text-emerald-500" />
            <span className="truncate">Entradas</span>
          </span>
          <MoneyValue
            value={totalIncome}
            className="truncate text-xl font-bold tracking-tight tabular-nums text-emerald-500 sm:text-2xl"
          />
        </div>

        <div className="flex flex-col gap-0.5 bg-card p-4 sm:gap-1 sm:p-5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <ArrowUpRight className="size-3.5 shrink-0 text-red-500" />
            <span className="truncate">Saídas</span>
          </span>
          <MoneyValue
            value={totalExpense}
            className="truncate text-xl font-bold tracking-tight tabular-nums text-red-500 sm:text-2xl"
          />
        </div>
      </div>
    </Card>
  )
}
