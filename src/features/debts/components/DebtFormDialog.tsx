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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoneyInput } from "@/components/MoneyInput"
import { toErrorMessage } from "@/lib/errors"
import { addMonths, annualRate, formatPct, impliedMonthlyRate, monthYear } from "../amortization"
import { DEBT_KINDS, type Debt, type DebtInput, type DebtKind } from "../types"

interface DebtFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt?: Debt
  onSubmit: (input: DebtInput) => Promise<void>
}

export function DebtFormDialog({ open, onOpenChange, debt, onSubmit }: DebtFormDialogProps) {
  const [kind, setKind] = useState<DebtKind>("veiculo")
  const [name, setName] = useState("")
  const [institution, setInstitution] = useState("")
  const [financed, setFinanced] = useState(0)
  const [installment, setInstallment] = useState(0)
  const [total, setTotal] = useState("")
  const [firstDue, setFirstDue] = useState("")
  const [alreadyPaid, setAlreadyPaid] = useState("")
  const [rate, setRate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setKind(debt?.kind ?? "veiculo")
    setName(debt?.name ?? "")
    setInstitution(debt?.institution ?? "")
    setFinanced(debt?.financedAmount ?? 0)
    setInstallment(debt?.installmentAmount ?? 0)
    setTotal(debt ? String(debt.totalInstallments) : "")
    setFirstDue(debt?.firstDueDate.slice(0, 10) ?? "")
    setAlreadyPaid("")
    setRate(debt?.monthlyRate ? String(debt.monthlyRate).replace(".", ",") : "")
  }, [open, debt])

  const count = Number(total) || 0
  const paid = Number(alreadyPaid) || 0
  const typedRate = Number(rate.replace(",", ".")) || 0
  const implied = impliedMonthlyRate(financed, installment, count)
  const paidTooMany = !debt && paid > count
  const canPreviewRate = financed > 0 && installment > 0 && count > 0

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        name,
        kind,
        institution,
        financedAmount: financed,
        installmentAmount: installment,
        totalInstallments: count,
        firstDueDate: `${firstDue}T00:00:00Z`,
        monthlyRate: typedRate,
        alreadyPaid: debt ? 0 : paid,
      })
      onOpenChange(false)
    } catch (err) {
      toast.error(toErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{debt ? "Editar contrato" : "Novo contrato"}</DialogTitle>
          <DialogDescription>Copie os dados da sua cédula de crédito (CCB).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="debt-kind">Tipo</Label>
              <Select value={kind} onValueChange={(v) => setKind((v ?? "outro") as DebtKind)}>
                <SelectTrigger id="debt-kind" className="w-full">
                  <SelectValue>{DEBT_KINDS.find((k) => k.value === kind)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DEBT_KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="debt-institution">Banco</Label>
              <Input
                id="debt-institution"
                placeholder="Ex: Banco Pan"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="debt-name">Nome</Label>
            <Input
              id="debt-name"
              placeholder="Ex: Financiamento do carro"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="debt-financed">Valor total financiado</Label>
              <MoneyInput id="debt-financed" required value={financed} onValueChange={setFinanced} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="debt-installment">Valor da parcela</Label>
              <MoneyInput id="debt-installment" required value={installment} onValueChange={setInstallment} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="debt-total">Total de parcelas</Label>
              <Input
                id="debt-total"
                type="number"
                min={1}
                max={600}
                required
                value={total}
                onChange={(e) => setTotal(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="debt-first-due">Vencimento da 1ª</Label>
              <Input
                id="debt-first-due"
                type="date"
                required
                value={firstDue}
                onChange={(e) => setFirstDue(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="debt-rate">Taxa do contrato (% a.m.)</Label>
              <Input
                id="debt-rate"
                inputMode="decimal"
                placeholder={implied > 0 ? (implied * 100).toFixed(2).replace(".", ",") : "1,79"}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
            {!debt && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="debt-paid">Parcelas já pagas</Label>
                <Input
                  id="debt-paid"
                  type="number"
                  min={0}
                  max={count || undefined}
                  placeholder="0"
                  value={alreadyPaid}
                  onChange={(e) => setAlreadyPaid(e.target.value)}
                />
              </div>
            )}
          </div>

          {canPreviewRate && (
            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              {implied > 0
                ? `Taxa implícita: ${formatPct(implied)} a.m. (${formatPct(annualRate(implied), 1)} a.a.). `
                : "A soma das parcelas não supera o valor financiado: informe a taxa do contrato. "}
              {typedRate > 0
                ? "Vamos usar a taxa que você informou para calcular os descontos."
                : "Sem taxa informada, usamos a implícita. A taxa pactuada na cédula é mais precisa."}
              {firstDue && ` Última parcela em ${monthYear(addMonths(firstDue, count - 1))}.`}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || paidTooMany}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
