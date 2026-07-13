import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CategorySelect } from "@/features/categories/components/CategorySelect"
import type { AccountPurchase, AccountPurchaseInput } from "../types"

interface AccountPurchaseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase?: AccountPurchase
  onSubmit: (input: AccountPurchaseInput) => Promise<void>
}

export function AccountPurchaseFormDialog({ open, onOpenChange, purchase, onSubmit }: AccountPurchaseFormDialogProps) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(purchase?.name ?? "")
      setAmount(purchase ? String(purchase.amount) : "")
      setDate(purchase?.date ?? new Date().toISOString().slice(0, 10))
      setCategoryId(purchase?.categoryId ?? "")
    }
  }, [open, purchase])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({ name, amount: Number(amount), date, categoryId })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{purchase ? "Editar compra" : "Nova compra no débito"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="acc-purchase-name">Descrição</Label>
            <Input id="acc-purchase-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="acc-purchase-amount">Valor</Label>
              <Input
                id="acc-purchase-amount"
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="acc-purchase-date">Data</Label>
              <Input
                id="acc-purchase-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="acc-purchase-category">Categoria</Label>
            <CategorySelect id="acc-purchase-category" value={categoryId} onChange={setCategoryId} />
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
