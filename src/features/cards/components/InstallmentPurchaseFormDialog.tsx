import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CategorySelect } from "@/features/categories/components/CategorySelect"
import type { InstallmentPurchase, InstallmentPurchaseInput } from "../types"

interface InstallmentPurchaseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase?: InstallmentPurchase
  // When true, this is a one-off ("avulsa", 1x) purchase: the installments
  // count is fixed to 1 and its field is hidden.
  oneOff?: boolean
  onSubmit: (input: InstallmentPurchaseInput) => Promise<void>
}

export function InstallmentPurchaseFormDialog({
  open,
  onOpenChange,
  purchase,
  oneOff = false,
  onSubmit,
}: InstallmentPurchaseFormDialogProps) {
  const [name, setName] = useState("")
  const [installmentAmount, setInstallmentAmount] = useState("")
  const [totalInstallments, setTotalInstallments] = useState("")
  const [firstInstallmentDate, setFirstInstallmentDate] = useState("")
  const [domain, setDomain] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(purchase?.name ?? "")
      setInstallmentAmount(purchase ? String(purchase.installmentAmount) : "")
      setTotalInstallments(purchase ? String(purchase.totalInstallments) : "")
      setFirstInstallmentDate(purchase?.firstInstallmentDate ?? "")
      setDomain(purchase?.domain ?? "")
      setCategoryId(purchase?.categoryId ?? "")
    }
  }, [open, purchase])

  const isEdit = Boolean(purchase)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        name,
        installmentAmount: Number(installmentAmount),
        totalInstallments: oneOff ? 1 : Number(totalInstallments),
        firstInstallmentDate,
        domain,
        categoryId,
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {oneOff
              ? isEdit
                ? "Editar compra avulsa"
                : "Nova compra avulsa"
              : isEdit
                ? "Editar compra parcelada"
                : "Nova compra parcelada"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase-name">Nome</Label>
            <Input id="purchase-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase-amount">{oneOff ? "Valor" : "Valor da parcela"}</Label>
            <Input
              id="purchase-amount"
              type="number"
              step="0.01"
              min="0"
              required
              value={installmentAmount}
              onChange={(e) => setInstallmentAmount(e.target.value)}
            />
          </div>
          {!oneOff && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="purchase-total">Total de parcelas</Label>
              <Input
                id="purchase-total"
                type="number"
                step="1"
                min="1"
                required
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase-date">{oneOff ? "Data da compra" : "Data da primeira parcela"}</Label>
            <Input
              id="purchase-date"
              type="date"
              required
              value={firstInstallmentDate}
              onChange={(e) => setFirstInstallmentDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase-domain">Site (opcional, para exibir o logotipo)</Label>
            <Input
              id="purchase-domain"
              placeholder="Ex: apple.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="purchase-category">Categoria</Label>
            <CategorySelect id="purchase-category" value={categoryId} onChange={setCategoryId} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
