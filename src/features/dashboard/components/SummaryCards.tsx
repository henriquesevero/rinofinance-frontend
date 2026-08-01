import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react"
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

// A slim progress bar (done / total) in the given color.
function ProgressBar({ done, total, color }: { done: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-[width]", color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

// "Realizado vs previsto" summary: what's already come in / gone out this
// month, how much is still pending, and the projected vs realized balance —
// turning the ledger into a "am I on track?" view.
export function SummaryCards({ totalIncome, totalExpense, netBalance, receivedIncome, paidExpense }: SummaryCardsProps) {
  const toReceive = Math.max(0, totalIncome - receivedIncome)
  const toPay = Math.max(0, totalExpense - paidExpense)
  const realized = receivedIncome - paidExpense
  const projectedPositive = netBalance >= 0
  const realizedPositive = realized >= 0

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Entradas */}
      <Card className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <ArrowDownLeft className="size-4 text-emerald-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entradas</h2>
        </div>
        <MoneyValue value={totalIncome} className="text-2xl font-bold tracking-tight tabular-nums text-emerald-500" />
        <ProgressBar done={receivedIncome} total={totalIncome} color="bg-emerald-500" />
        <p className="text-xs text-muted-foreground tabular-nums">
          Recebido <MoneyValue value={receivedIncome} className="font-medium text-foreground" /> · faltam{" "}
          <MoneyValue value={toReceive} className="font-medium text-foreground" />
        </p>
      </Card>

      {/* Saídas */}
      <Card className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="size-4 text-red-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saídas</h2>
        </div>
        <MoneyValue value={totalExpense} className="text-2xl font-bold tracking-tight tabular-nums text-red-500" />
        <ProgressBar done={paidExpense} total={totalExpense} color="bg-red-500" />
        <p className="text-xs text-muted-foreground tabular-nums">
          Pago <MoneyValue value={paidExpense} className="font-medium text-foreground" /> · faltam{" "}
          <MoneyValue value={toPay} className="font-medium text-foreground" />
        </p>
      </Card>

      {/* Saldo: projetado x realizado */}
      <Card className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <Scale className={cn("size-4", projectedPositive ? "text-emerald-500" : "text-red-500")} />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saldo do mês</h2>
        </div>
        <MoneyValue
          value={netBalance}
          className={cn(
            "text-2xl font-bold tracking-tight tabular-nums",
            projectedPositive ? "text-emerald-500" : "text-red-500"
          )}
        />
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Projetado</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          Realizado{" "}
          <MoneyValue
            value={realized}
            className={cn("font-semibold", realizedPositive ? "text-emerald-500" : "text-red-500")}
          />
        </p>
      </Card>
    </div>
  )
}
