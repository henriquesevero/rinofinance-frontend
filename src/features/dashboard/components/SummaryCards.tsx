import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react"
import { Card } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"

interface SummaryCardsProps {
  totalIncome: number
  totalExpense: number
  netBalance: number
}

// Header + value styled like the dashboard's financial-overview cards (accent
// icon, uppercase muted label, bold tabular value in the semantic color),
// kept compact for this page.
export function SummaryCards({ totalIncome, totalExpense, netBalance }: SummaryCardsProps) {
  const balancePositive = netBalance >= 0
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <ArrowDownLeft className="size-4 text-emerald-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entradas ativas</h2>
        </div>
        <MoneyValue value={totalIncome} className="text-2xl font-bold tracking-tight tabular-nums text-emerald-500" />
      </Card>

      <Card className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="size-4 text-red-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saídas ativas</h2>
        </div>
        <MoneyValue value={totalExpense} className="text-2xl font-bold tracking-tight tabular-nums text-red-500" />
      </Card>

      <Card className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <Wallet className={cn("size-4", balancePositive ? "text-emerald-500" : "text-red-500")} />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saldo do mês</h2>
        </div>
        <MoneyValue
          value={netBalance}
          className={cn(
            "text-2xl font-bold tracking-tight tabular-nums",
            balancePositive ? "text-emerald-500" : "text-red-500"
          )}
        />
      </Card>
    </div>
  )
}
