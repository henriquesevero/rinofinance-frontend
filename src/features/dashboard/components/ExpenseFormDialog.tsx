import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CategorySelect } from "@/features/categories/components/CategorySelect"
import { AccountSelect } from "@/features/accounts/components/AccountSelect"
import { useAccountsStore } from "@/features/accounts/store"
import { formatMoney } from "@/lib/money"
import type { CardOverview } from "@/features/cards/types"
import type { Expense } from "../types"

type LinkType = "manual" | "card" | "account"

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense
  cards: CardOverview[]
  onSubmitManual: (name: string, amount: number, categoryId: string) => Promise<void>
  onSubmitCardLinked: (name: string, cardId: string, categoryId: string) => Promise<void>
  onSubmitAccountLinked: (name: string, accountId: string, categoryId: string) => Promise<void>
}

// Handles create (manual amount, linked to a card, or linked to an account
// — both mirror a live total) and edit (name + amount only; linked expenses
// aren't edited, their amount is managed).
export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  cards,
  onSubmitManual,
  onSubmitCardLinked,
  onSubmitAccountLinked,
}: ExpenseFormDialogProps) {
  const accounts = useAccountsStore((s) => s.accounts)
  const isEdit = Boolean(expense)
  const [linkType, setLinkType] = useState<LinkType>("manual")
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [cardId, setCardId] = useState("")
  const [accountId, setAccountId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const selectedCard = cards.find((c) => c.id === cardId)
  const selectedAccount = accounts.find((a) => a.id === accountId)

  useEffect(() => {
    if (open) {
      setName(expense?.name ?? "")
      setAmount(expense ? String(expense.amount) : "")
      setCategoryId(expense?.categoryId ?? "")
      setLinkType("manual")
      setCardId(cards[0]?.id ?? "")
      setAccountId("")
    }
  }, [open, expense, cards])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      if (!isEdit && linkType === "card") {
        await onSubmitCardLinked(name, cardId, categoryId)
      } else if (!isEdit && linkType === "account") {
        await onSubmitAccountLinked(name, accountId, categoryId)
      } else {
        await onSubmitManual(name, Number(amount), categoryId)
      }
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canLink = !isEdit && (cards.length > 0 || accounts.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar saída" : "Nova saída"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-name">Nome</Label>
            <Input id="expense-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {canLink && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-linktype">Tipo</Label>
              <Select value={linkType} onValueChange={(v) => setLinkType((v as LinkType) ?? "manual")}>
                <SelectTrigger id="expense-linktype">
                  <SelectValue>
                    {(value: string | null) =>
                      value === "card"
                        ? "Vincular a um cartão"
                        : value === "account"
                          ? "Vincular a uma conta"
                          : "Valor manual"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Valor manual</SelectItem>
                  {cards.length > 0 && <SelectItem value="card">Vincular a um cartão</SelectItem>}
                  {accounts.length > 0 && <SelectItem value="account">Vincular a uma conta</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isEdit && linkType === "card" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-card">Cartão</Label>
              <Select value={cardId} onValueChange={(value) => setCardId(value ?? "")}>
                <SelectTrigger id="expense-card">
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
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Valor da fatura do mês</span>
                <span className="font-semibold tabular-nums">{formatMoney(selectedCard?.monthlyTotal ?? 0)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                O valor acompanha automaticamente o total do cartão a cada mês.
              </p>
            </div>
          ) : !isEdit && linkType === "account" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-account">Conta</Label>
              <AccountSelect id="expense-account" value={accountId} onChange={setAccountId} />
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Compras no débito do mês</span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(selectedAccount?.monthlyDebitTotal ?? 0)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                O valor acompanha automaticamente as compras no débito da conta no mês.
              </p>
            </div>
          ) : isEdit && (expense?.cardId || expense?.accountId) ? (
            <div className="flex flex-col gap-2">
              <Label>Valor</Label>
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  {expense?.cardId ? "Acompanha a fatura do cartão" : "Acompanha as compras no débito"}
                </span>
                <span className="font-semibold tabular-nums">{formatMoney(expense?.amount ?? 0)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Saída vinculada — o valor é calculado automaticamente. Você pode editar o nome e a categoria.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-amount">Valor</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-category">Categoria</Label>
            <CategorySelect id="expense-category" value={categoryId} onChange={setCategoryId} />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (linkType === "card" && !cardId) ||
                (linkType === "account" && !accountId)
              }
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
