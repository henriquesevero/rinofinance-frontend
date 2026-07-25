import { CalendarClock, CheckCircle2, Receipt } from "lucide-react"
import { Card } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { BrandLogo } from "@/features/cards/components/BrandLogo"
import { logoDomain } from "@/features/cards/fatura/brands"
import type { Expense } from "../types"

interface UpcomingBillsProps {
  expenses: Expense[]
}

// "N contas a pagar": a compact banner summarizing the month's still-unpaid
// expenses, with a stack of their brand logos — mirrors the reference's
// upcoming-bills strip.
export function UpcomingBills({ expenses }: UpcomingBillsProps) {
  const pending = expenses.filter((e) => e.active && !e.paid)
  const total = pending.reduce((sum, e) => sum + e.amount, 0)

  if (pending.length === 0) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Tudo em dia</p>
          <p className="text-xs text-muted-foreground">Nenhuma conta pendente neste mês.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Receipt className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {pending.length} {pending.length === 1 ? "conta a pagar" : "contas a pagar"}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="size-3" />
            Total: <MoneyValue value={total} className="font-medium tabular-nums" />
          </p>
        </div>
      </div>

      {/* overlapping brand logos of the pending bills */}
      <div className="flex shrink-0 items-center -space-x-2">
        {pending.slice(0, 5).map((e) => (
          <span
            key={e.id}
            title={e.name}
            className="flex size-8 items-center justify-center rounded-full bg-background ring-2 ring-background"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-muted ring-1 ring-black/5">
              <BrandLogo domain={logoDomain(e.name)} fallbackIcon={Receipt} size={32} className="size-4" />
            </span>
          </span>
        ))}
        {pending.length > 5 && (
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium ring-2 ring-background">
            +{pending.length - 5}
          </span>
        )}
      </div>
    </Card>
  )
}
