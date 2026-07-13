import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CategorySelect } from "@/features/categories/components/CategorySelect"
import type { Subscription, SubscriptionInput } from "../types"

interface SubscriptionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription?: Subscription
  onSubmit: (input: SubscriptionInput) => Promise<void>
}

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  subscription,
  onSubmit,
}: SubscriptionFormDialogProps) {
  const [name, setName] = useState("")
  const [monthlyAmount, setMonthlyAmount] = useState("")
  const [domain, setDomain] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(subscription?.name ?? "")
      setMonthlyAmount(subscription ? String(subscription.monthlyAmount) : "")
      setDomain(subscription?.domain ?? "")
      setCategoryId(subscription?.categoryId ?? "")
    }
  }, [open, subscription])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({ name, monthlyAmount: Number(monthlyAmount), domain, categoryId })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subscription ? "Editar assinatura" : "Nova assinatura"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="subscription-name">Nome</Label>
            <Input id="subscription-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="subscription-amount">Valor mensal</Label>
            <Input
              id="subscription-amount"
              type="number"
              step="0.01"
              min="0"
              required
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="subscription-domain">Site (opcional, para exibir o logotipo)</Label>
            <Input
              id="subscription-domain"
              placeholder="Ex: netflix.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="subscription-category">Categoria</Label>
            <CategorySelect id="subscription-category" value={categoryId} onChange={setCategoryId} />
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
