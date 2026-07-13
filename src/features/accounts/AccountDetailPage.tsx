import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { CategoryChip } from "@/features/categories/components/CategoryChip"
import { AccountAvatar } from "./components/AccountAvatar"
import { AccountFormDialog } from "./components/AccountFormDialog"
import { AccountPurchaseFormDialog } from "./components/AccountPurchaseFormDialog"
import { useAccountsStore } from "./store"
import type { AccountPurchase } from "./types"

type PurchaseDialogState = { mode: "create" } | { mode: "edit"; purchase: AccountPurchase } | null

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })

export function AccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>()
  const navigate = useNavigate()
  const accounts = useAccountsStore((s) => s.accounts)
  const isLoading = useAccountsStore((s) => s.isLoading)
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)
  const updateAccount = useAccountsStore((s) => s.updateAccount)
  const deleteAccount = useAccountsStore((s) => s.deleteAccount)
  const createPurchase = useAccountsStore((s) => s.createPurchase)
  const updatePurchase = useAccountsStore((s) => s.updatePurchase)
  const deletePurchase = useAccountsStore((s) => s.deletePurchase)

  const [isEditing, setIsEditing] = useState(false)
  const [purchaseDialog, setPurchaseDialog] = useState<PurchaseDialogState>(null)

  useEffect(() => {
    if (accounts.length === 0) fetchAccounts()
  }, [accounts.length, fetchAccounts])

  const account = accounts.find((a) => a.id === accountId)

  if (!account) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Carregando...
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-muted-foreground">Conta não encontrada.</p>
        <Link to="/accounts" className="text-sm font-medium text-primary hover:underline">
          Voltar às contas
        </Link>
      </div>
    )
  }

  async function handleDeleteAccount() {
    if (!account) return
    if (!confirm(`Remover a conta "${account.name}" e suas compras?`)) return
    try {
      await deleteAccount(account.id)
      toast.success("Conta removida")
      navigate("/accounts")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleDeletePurchase(id: string) {
    try {
      await deletePurchase(id)
      toast.success("Compra removida")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/accounts"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Contas
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <AccountAvatar account={account} className="size-16" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold" title={account.name}>
              {account.name}
            </p>
            <p className="text-xs text-muted-foreground">Conta corrente</p>
          </div>
        </div>
        <dl className="grid flex-1 grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Saldo atual</dt>
            <dd
              className={cn(
                "text-2xl font-bold tracking-tight",
                account.balance < 0 && "text-red-600 dark:text-red-400"
              )}
            >
              <MoneyValue value={account.balance} />
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Compras no mês</dt>
            <dd className="text-xl font-semibold">
              <MoneyValue value={account.monthlyDebitTotal} />
            </dd>
          </div>
        </dl>
        <div className="flex gap-1 self-start">
          <Button variant="ghost" size="icon" aria-label="Editar conta" onClick={() => setIsEditing(true)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Remover conta" onClick={handleDeleteAccount}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Compras no débito</h3>
          <Button variant="outline" size="sm" onClick={() => setPurchaseDialog({ mode: "create" })}>
            <Plus className="size-4" />
            Nova compra
          </Button>
        </div>
        {account.purchases.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma compra lançada.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {account.purchases.map((purchase) => (
              <li key={purchase.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium" title={purchase.name}>
                      {purchase.name}
                    </span>
                    <CategoryChip categoryId={purchase.categoryId} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {dateFormatter.format(new Date(`${purchase.date}T00:00:00`))}
                  </span>
                </div>
                <MoneyValue value={purchase.amount} className="shrink-0 font-medium tabular-nums" />
                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar compra"
                    onClick={() => setPurchaseDialog({ mode: "edit", purchase })}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover compra"
                    onClick={() => handleDeletePurchase(purchase.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AccountFormDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        initial={{
          name: account.name,
          color: account.color ?? "",
          imageUrl: account.imageUrl ?? "",
          balance: account.balance,
        }}
        onSubmit={async (input) => {
          try {
            await updateAccount(account.id, input)
            toast.success("Conta atualizada")
          } catch (err) {
            toast.error(toErrorMessage(err))
            throw err
          }
        }}
      />

      <AccountPurchaseFormDialog
        open={purchaseDialog !== null}
        onOpenChange={(open) => !open && setPurchaseDialog(null)}
        purchase={purchaseDialog?.mode === "edit" ? purchaseDialog.purchase : undefined}
        onSubmit={async (input) => {
          if (purchaseDialog?.mode === "edit") {
            await updatePurchase(purchaseDialog.purchase.id, input)
            toast.success("Compra atualizada")
          } else {
            await createPurchase(account.id, input)
            toast.success("Compra lançada")
          }
        }}
      />
    </div>
  )
}
