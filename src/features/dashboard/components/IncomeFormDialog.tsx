import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatMoney } from "@/lib/money"
import { AccountSelect } from "@/features/accounts/components/AccountSelect"
import { useAccountsStore } from "@/features/accounts/store"
import { CategorySelect } from "@/features/categories/components/CategorySelect"
import type { Income } from "../types"

interface IncomeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  income?: Income
  onSubmit: (name: string, amount: number, categoryId: string) => Promise<void>
  onSubmitAccountLinked: (name: string, accountId: string, categoryId: string) => Promise<void>
}

// Handles create (manual amount OR linked to a bank account, mirroring the
// card-linked expense rule) and edit (name + amount only — account-linked
// incomes aren't offered for editing, their amount follows the balance).
export function IncomeFormDialog({
  open,
  onOpenChange,
  income,
  onSubmit,
  onSubmitAccountLinked,
}: IncomeFormDialogProps) {
  const accounts = useAccountsStore((s) => s.accounts)
  const isEdit = Boolean(income)
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [linkToAccount, setLinkToAccount] = useState(false)
  const [accountId, setAccountId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(income?.name ?? "")
      setAmount(income ? String(income.amount) : "")
      setCategoryId(income?.categoryId ?? "")
      setLinkToAccount(false)
      setAccountId("")
    }
  }, [open, income])

  const selectedAccount = accounts.find((a) => a.id === accountId)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      if (!isEdit && linkToAccount) {
        await onSubmitAccountLinked(name, accountId, categoryId)
      } else {
        await onSubmit(name, Number(amount), categoryId)
      }
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{income ? "Editar entrada" : "Nova entrada"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="income-name">Nome</Label>
            <Input id="income-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {!isEdit && accounts.length > 0 && (
            <label htmlFor="income-link-account-toggle" className="flex items-center gap-2 text-sm">
              <input
                id="income-link-account-toggle"
                type="checkbox"
                className="size-4"
                checked={linkToAccount}
                onChange={(e) => setLinkToAccount(e.target.checked)}
              />
              Vincular a uma conta (valor acompanha o saldo)
            </label>
          )}

          {!isEdit && linkToAccount ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="income-account">Conta</Label>
              <AccountSelect id="income-account" value={accountId} onChange={setAccountId} />
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Saldo atual da conta</span>
                <span className="font-semibold tabular-nums">{formatMoney(selectedAccount?.balance ?? 0)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                O valor da entrada acompanha automaticamente o saldo da conta.
              </p>
            </div>
          ) : isEdit && income?.accountId ? (
            <div className="flex flex-col gap-2">
              <Label>Valor</Label>
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Acompanha o saldo da conta</span>
                <span className="font-semibold tabular-nums">{formatMoney(income.amount)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Entrada vinculada a uma conta — o valor segue o saldo automaticamente. Você pode editar o nome e a categoria.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="income-amount">Valor</Label>
              <Input
                id="income-amount"
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
            <Label htmlFor="income-category">Categoria</Label>
            <CategorySelect id="income-category" value={categoryId} onChange={setCategoryId} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || (linkToAccount && !accountId)}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
