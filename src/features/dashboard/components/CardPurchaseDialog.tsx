import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toErrorMessage } from "@/lib/errors"
import { useCardsStore } from "@/features/cards/store"
import { CategorySelect } from "@/features/categories/components/CategorySelect"
import { useDashboardStore } from "../store"

// Quick-launch a card purchase from the dashboard, without navigating to
// the cards page. mode "credit" is a one-off (1x) purchase; mode
// "installment" lets the user set the number of installments.
export function CardPurchaseDialog({
  open,
  onOpenChange,
  mode,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "credit" | "installment"
}) {
  const cards = useCardsStore((s) => s.cards)
  const fetchCards = useCardsStore((s) => s.fetchCards)
  const createInstallmentPurchase = useCardsStore((s) => s.createInstallmentPurchase)
  const fetchSummary = useDashboardStore((s) => s.fetchSummary)

  const [cardId, setCardId] = useState("")
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [totalInstallments, setTotalInstallments] = useState("2")
  const [date, setDate] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (cards.length === 0) fetchCards()
      setCardId(cards[0]?.id ?? "")
      setName("")
      setAmount("")
      setTotalInstallments("2")
      setDate(new Date().toISOString().slice(0, 10))
      setCategoryId("")
    }
  }, [open, cards, fetchCards])

  const isInstallment = mode === "installment"

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await createInstallmentPurchase(cardId, {
        name,
        installmentAmount: Number(amount),
        totalInstallments: isInstallment ? Number(totalInstallments) : 1,
        firstInstallmentDate: date,
        domain: "",
        categoryId,
      })
      await fetchSummary()
      toast.success(isInstallment ? "Compra parcelada lançada" : "Compra no crédito lançada")
      onOpenChange(false)
    } catch (err) {
      toast.error(toErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isInstallment ? "Compra parcelada" : "Compra no crédito"}</DialogTitle>
        </DialogHeader>
        {cards.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Cadastre um cartão primeiro para lançar compras no crédito.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cardpurchase-card">Cartão</Label>
              <Select value={cardId} onValueChange={(v) => setCardId(v ?? "")}>
                <SelectTrigger id="cardpurchase-card">
                  <SelectValue placeholder="Selecione um cartão">
                    {(value: string | null) => cards.find((c) => c.id === value)?.name ?? "Selecione um cartão"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cardpurchase-name">Descrição</Label>
              <Input id="cardpurchase-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cardpurchase-amount">
                  {isInstallment ? "Valor da parcela" : "Valor"}
                </Label>
                <Input
                  id="cardpurchase-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              {isInstallment && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cardpurchase-total">Nº de parcelas</Label>
                  <Input
                    id="cardpurchase-total"
                    type="number"
                    step="1"
                    min="2"
                    required
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cardpurchase-date">{isInstallment ? "Data da 1ª parcela" : "Data da compra"}</Label>
              <Input
                id="cardpurchase-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cardpurchase-category">Categoria</Label>
              <CategorySelect id="cardpurchase-category" value={categoryId} onChange={setCategoryId} />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !cardId}>
                {isSubmitting ? "Lançando..." : "Lançar compra"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
