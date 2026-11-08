import { useMemo, useState } from "react"
import { CalendarClock, CalendarCheck, Check, MoreHorizontal, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { formatPct, shortDate, type Installment, type InstallmentStatus } from "../amortization"

const STATUS: Record<InstallmentStatus, { label: string; className: string }> = {
  paid: { label: "Paga", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  anticipated: { label: "Antecipada", className: "bg-primary/10 text-primary" },
  overdue: { label: "Vencida", className: "bg-destructive/10 text-destructive" },
  open: { label: "A vencer", className: "bg-muted text-muted-foreground" },
}

const isSettled = (item: Installment) => item.status === "paid" || item.status === "anticipated"

interface InstallmentsPanelProps {
  schedule: Installment[]
  onMarkPaid: (item: Installment) => void
  onAnticipate: (item: Installment) => void
  onUndo: (item: Installment) => void
}

export function InstallmentsPanel({ schedule, onMarkPaid, onAnticipate, onUndo }: InstallmentsPanelProps) {
  const [showSettled, setShowSettled] = useState(false)
  const settledCount = schedule.filter(isSettled).length

  const years = useMemo(() => {
    const groups = new Map<string, Installment[]>()
    for (const item of schedule) {
      if (!showSettled && isSettled(item)) continue
      const year = item.dueDate.slice(0, 4)
      groups.set(year, [...(groups.get(year) ?? []), item])
    }
    return [...groups.entries()]
  }, [schedule, showSettled])

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <CalendarClock className="size-4 shrink-0 text-primary" />
        <h2 className="text-sm font-semibold">Parcelas</h2>
        {settledCount > 0 && (
          <Button variant="ghost" size="sm" className="ml-auto h-8" onClick={() => setShowSettled((v) => !v)}>
            {showSettled ? "Ocultar quitadas" : `Mostrar quitadas (${settledCount})`}
          </Button>
        )}
      </div>

      <div className="scrollbar-hide flex max-h-[32rem] flex-col gap-5 overflow-y-auto">
        {years.map(([year, items]) => {
          const pending = items.filter((i) => i.status === "open" || i.status === "overdue")
          return (
            <div key={year} className="flex flex-col">
              <div className="flex items-baseline gap-2 border-b px-1 pb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{year}</span>
                <span className="text-[11px] text-muted-foreground">
                  {pending.length} de {items.length} em aberto
                </span>
                <MoneyValue
                  value={pending.reduce((s, i) => s + i.amount, 0)}
                  className="ml-auto text-sm font-semibold tabular-nums"
                />
              </div>
              <ul>
                {items.map((item) => (
                  <InstallmentRow
                    key={item.number}
                    item={item}
                    onMarkPaid={onMarkPaid}
                    onAnticipate={onAnticipate}
                    onUndo={onUndo}
                  />
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function InstallmentRow({
  item,
  onMarkPaid,
  onAnticipate,
  onUndo,
}: { item: Installment } & Omit<InstallmentsPanelProps, "schedule">) {
  const settled = isSettled(item)
  const discount = item.amount > 0 ? 1 - item.presentValue / item.amount : 0
  const status = STATUS[item.status]

  return (
    <li className={cn("group flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-muted/50", settled && "opacity-70")}>
      <span className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">
        {item.number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium tabular-nums">{shortDate(item.dueDate)}</span>
          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide", status.className)}>
            {status.label}
          </span>
        </div>
        {item.status === "anticipated" && item.paidAt && (
          <span className="text-xs text-muted-foreground">em {shortDate(item.paidAt)}</span>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end">
        {settled ? (
          <MoneyValue value={item.paidAmount ?? item.amount} className="text-sm font-semibold tabular-nums" />
        ) : (
          <>
            <MoneyValue value={item.presentValue} className="text-sm font-semibold tabular-nums" />
            <span className="text-xs text-muted-foreground tabular-nums">
              {discount > 0.0005 ? (
                <>
                  de <MoneyValue value={item.amount} className="tabular-nums" /> · −{formatPct(discount, 1)}
                </>
              ) : (
                "sem desconto"
              )}
            </span>
          </>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100 [@media(hover:none)]:opacity-100"
              aria-label={`Ações da parcela ${item.number}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent>
          {settled ? (
            <DropdownMenuItem onClick={() => onUndo(item)}>
              <Undo2 className="size-4" />
              Desfazer pagamento
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={() => onMarkPaid(item)}>
                <Check className="size-4" />
                Marcar como paga
              </DropdownMenuItem>
              {item.daysUntilDue > 0 && (
                <DropdownMenuItem onClick={() => onAnticipate(item)}>
                  <CalendarCheck className="size-4" />
                  Registrar antecipação
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
