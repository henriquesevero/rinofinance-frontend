import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react"
import { Card } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"

interface MonthBalanceCardProps {
  income: number
  spent: number
}

export function MonthBalanceCard({ income, spent }: MonthBalanceCardProps) {
  const result = income - spent
  const positive = result >= 0
  const savingsRate = income > 0 ? Math.round((result / income) * 100) : null
  const max = Math.max(income, spent, 1)

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Scale className={cn("size-4", positive ? "text-emerald-500" : "text-red-500")} />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Balanço do mês</h2>
      </div>

      <div>
        <MoneyValue
          value={result}
          className={cn(
            "text-3xl font-bold tracking-tight tabular-nums",
            positive ? "text-emerald-500" : "text-red-500"
          )}
        />
        <p className="mt-1 text-sm text-muted-foreground">
          {positive ? "de sobra este mês" : "de déficit este mês"}
          {positive && savingsRate !== null && ` · guardando ${savingsRate}% da renda`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <ArrowDownLeft className="size-3.5 text-emerald-500" />
              Entradas
            </span>
            <MoneyValue value={income} className="font-semibold tabular-nums text-emerald-500" />
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(income / max) * 100}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <ArrowUpRight className="size-3.5 text-red-500" />
              Saídas
            </span>
            <MoneyValue value={spent} className="font-semibold tabular-nums text-red-500" />
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-red-500" style={{ width: `${(spent / max) * 100}%` }} />
          </div>
        </div>
      </div>
    </Card>
  )
}
