import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoneyInput } from "@/components/MoneyInput"
import { MoneyValue } from "@/components/MoneyValue"
import { toErrorMessage } from "@/lib/errors"
import { allocatePaidAmount, todayISO, type Installment } from "../amortization"
import type { RegisterPaymentsInput } from "../types"

interface RegisterAnticipationDialogProps {
  items: Installment[] | null
  onOpenChange: (open: boolean) => void
  onSubmit: (input: RegisterPaymentsInput) => Promise<void>
}

export function RegisterAnticipationDialog({ items, onOpenChange, onSubmit }: RegisterAnticipationDialogProps) {
  const [total, setTotal] = useState(0)
  const [date, setDate] = useState(todayISO)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const list = items ?? []
  const estimate = list.reduce((s, i) => s + i.presentValue, 0)
  const nominal = list.reduce((s, i) => s + i.amount, 0)

  useEffect(() => {
    if (!items) return
    setTotal(Math.round(items.reduce((s, i) => s + i.presentValue, 0) * 100) / 100)
    setDate(todayISO())
  }, [items])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        kind: "antecipada",
        paidAt: `${date}T00:00:00Z`,
        items: allocatePaidAmount(list, total),
      })
      onOpenChange(false)
    } catch (err) {
      toast.error(toErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const label =
    list.length === 1
      ? `a parcela ${list[0].number}`
      : `as parcelas ${list[0]?.number} a ${list[list.length - 1]?.number}`

  return (
    <Dialog open={items !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar antecipação</DialogTitle>
          <DialogDescription>
            Depois de pagar no banco, registre {label} com o valor real do boleto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="anticipation-total">Valor pago</Label>
              <MoneyInput id="anticipation-total" required value={total} onValueChange={setTotal} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="anticipation-date">Data do pagamento</Label>
              <Input
                id="anticipation-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3 text-sm">
            <Row label="Estimativa do RinoFinance" value={estimate} />
            <Row label="Valor original das parcelas" value={nominal} />
            <Row label="Economia real" value={Math.max(0, nominal - total)} accent />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || total <= 0}>
              {isSubmitting ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <MoneyValue value={value} className={accent ? "font-semibold tabular-nums text-emerald-500" : "font-medium tabular-nums"} />
    </div>
  )
}
