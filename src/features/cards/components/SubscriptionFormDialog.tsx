import { useEffect, useState, type FormEvent } from "react"
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
  const [monthlyAmount, setMonthlyAmount] = useState(0)
  const [domain, setDomain] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(subscription?.name ?? "")
      setMonthlyAmount(subscription?.monthlyAmount ?? 0)
      setDomain(subscription?.domain ?? "")
      setCategoryId(subscription?.categoryId ?? "")
    }
  }, [open, subscription])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({ name, monthlyAmount, domain, categoryId })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{subscription ? "Editar assinatura" : "Nova assinatura"}</DialogTitle>
          <DialogDescription>Uma cobrança mensal recorrente no cartão (ex: Netflix, Spotify).</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subscription-amount">Valor mensal</Label>
            <MoneyInput
              id="subscription-amount"
              required
              value={monthlyAmount}
              onValueChange={setMonthlyAmount}
              className="h-11 text-lg"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subscription-name">Nome</Label>
            <Input
              id="subscription-name"
              placeholder="Ex: Netflix, Spotify..."
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subscription-category">Categoria</Label>
            <CategorySelect id="subscription-category" value={categoryId} onChange={setCategoryId} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subscription-domain">Site (opcional)</Label>
            <Input
              id="subscription-domain"
              placeholder="Ex: netflix.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Usado para exibir o logotipo da marca na lista.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
