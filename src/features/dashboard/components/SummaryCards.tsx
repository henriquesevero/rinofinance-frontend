import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"

interface SummaryCardsProps {
  totalIncome: number
  totalExpense: number
  netBalance: number
  receivedIncome: number
  paidExpense: number
}

function Bar({ done, total, color }: { done: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function SummaryCards({ totalIncome, totalExpense, netBalance, receivedIncome, paidExpense }: SummaryCardsProps) {
  const toReceive = Math.max(0, totalIncome - receivedIncome)
  const toPay = Math.max(0, totalExpense - paidExpense)
  const realized = receivedIncome - paidExpense
  const projectedPositive = netBalance >= 0
  const realizedPositive = realized >= 0

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
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-[1.2fr_1fr_1fr]">
        <div
          className={cn(
            "col-span-2 flex flex-col justify-center gap-0.5 bg-card p-4 sm:col-span-1 sm:gap-1 sm:p-5",
            celebrate && "rf-celebrate"
          )}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Balanço do mês</span>
          <MoneyValue
            value={netBalance}
            className={cn(
              "text-2xl font-bold tracking-tight tabular-nums sm:text-3xl",
              projectedPositive ? "text-emerald-500" : "text-red-500"
            )}
          />
          <span className="text-xs text-muted-foreground">
            Realizado{" "}
            <MoneyValue
              value={realized}
              className={cn("font-semibold tabular-nums", realizedPositive ? "text-emerald-500" : "text-red-500")}
            />
          </span>
        </div>

        <div className="flex flex-col justify-center gap-1.5 bg-card p-4 sm:gap-2 sm:p-5">
          <div className="flex flex-col gap-0.5 md:flex-row md:items-center md:justify-between md:gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-500" />
              Entradas
            </span>
            <MoneyValue value={totalIncome} className="text-base font-bold tabular-nums text-emerald-500" />
          </div>
          <Bar done={receivedIncome} total={totalIncome} color="bg-emerald-500" />
          <span className="text-xs text-muted-foreground tabular-nums">
            Recebido <MoneyValue value={receivedIncome} className="font-medium text-foreground" /> · falta{" "}
            <MoneyValue value={toReceive} className="font-medium text-foreground" />
          </span>
        </div>

        <div className="flex flex-col justify-center gap-1.5 bg-card p-4 sm:gap-2 sm:p-5">
          <div className="flex flex-col gap-0.5 md:flex-row md:items-center md:justify-between md:gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="size-2 rounded-full bg-red-500" />
              Saídas
            </span>
            <MoneyValue value={totalExpense} className="text-base font-bold tabular-nums text-red-500" />
          </div>
          <Bar done={paidExpense} total={totalExpense} color="bg-red-500" />
          <span className="text-xs text-muted-foreground tabular-nums">
            Pago <MoneyValue value={paidExpense} className="font-medium text-foreground" /> · falta{" "}
            <MoneyValue value={toPay} className="font-medium text-foreground" />
          </span>
        </div>
      </div>
    </Card>
  )
}
