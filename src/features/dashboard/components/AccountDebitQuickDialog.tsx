import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toErrorMessage } from "@/lib/errors"
import { AccountSelect } from "@/features/accounts/components/AccountSelect"
import { useAccountsStore } from "@/features/accounts/store"
import { CategorySelect } from "@/features/categories/components/CategorySelect"

// Quick-launch a debit purchase onto an account from the dashboard, without
// navigating to the account's page. It's an account purchase (not a
// standalone saída), so it reduces the account's available balance.
export function AccountDebitQuickDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const accounts = useAccountsStore((s) => s.accounts)
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)
  const createPurchase = useAccountsStore((s) => s.createPurchase)
  const [accountId, setAccountId] = useState("")
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (accounts.length === 0) fetchAccounts()
      setAccountId("")
      setName("")
      setAmount("")
      setDate(new Date().toISOString().slice(0, 10))
      setCategoryId("")
    }
  }, [open, accounts.length, fetchAccounts])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await createPurchase(accountId, { name, amount: Number(amount), date, categoryId })
      toast.success("Compra no débito lançada")
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
          <DialogTitle>Compra no débito</DialogTitle>
        </DialogHeader>
        {accounts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Cadastre uma conta primeiro para lançar compras no débito.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="debit-account">Conta</Label>
              <AccountSelect id="debit-account" value={accountId} onChange={setAccountId} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="debit-name">Descrição</Label>
              <Input id="debit-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="debit-amount">Valor</Label>
                <Input
                  id="debit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="debit-date">Data</Label>
                <Input id="debit-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="debit-category">Categoria</Label>
              <CategorySelect id="debit-category" value={categoryId} onChange={setCategoryId} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !accountId}>
                {isSubmitting ? "Lançando..." : "Lançar débito"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
