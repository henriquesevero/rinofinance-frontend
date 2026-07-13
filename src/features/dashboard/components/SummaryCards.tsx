import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"

interface SummaryCardsProps {
  totalIncome: number
  totalExpense: number
  netBalance: number
}

export function SummaryCards({ totalIncome, totalExpense, netBalance }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Entradas ativas</CardDescription>
          <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">
            <MoneyValue value={totalIncome} />
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Saídas ativas</CardDescription>
          <CardTitle className="text-2xl text-red-600 dark:text-red-400">
            <MoneyValue value={totalExpense} />
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Saldo líquido do mês</CardDescription>
          <CardTitle
            className={cn(
              "text-2xl",
              netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}
          >
            <MoneyValue value={netBalance} />
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
