import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Check, Eraser, Loader2, MoreHorizontal, Pencil, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { MoneyValue } from "@/components/MoneyValue"
import { MoneyInput } from "@/components/MoneyInput"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { toErrorMessage } from "@/lib/errors"
import { CategoryChip } from "@/features/categories/components/CategoryChip"
import { AccountAvatar } from "./components/AccountAvatar"
import { AccountFormDialog } from "./components/AccountFormDialog"
import { AccountPurchaseFormDialog } from "./components/AccountPurchaseFormDialog"
import { ClearAccountPurchasesDialog } from "./components/ClearAccountPurchasesDialog"
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
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isClearingPurchases, setIsClearingPurchases] = useState(false)
  const [purchaseDialog, setPurchaseDialog] = useState<PurchaseDialogState>(null)
  const [editingBalance, setEditingBalance] = useState(false)
  const [balanceDraft, setBalanceDraft] = useState(0)
  const [savingBalance, setSavingBalance] = useState(false)

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

  function startEditBalance() {
    if (!account) return
    setBalanceDraft(account.balance)
    setEditingBalance(true)
  }

  async function saveBalance() {
    if (!account) return
    setSavingBalance(true)
    try {
      await updateAccount(account.id, {
        name: account.name,
        color: account.color ?? "",
        imageUrl: account.imageUrl ?? "",
        balance: balanceDraft,
        agency: account.agency ?? "",
        accountNumber: account.accountNumber ?? "",
        accountType: account.accountType ?? "",
      })
      toast.success("Saldo atualizado")
      setEditingBalance(false)
    } catch (err) {
      toast.error(toErrorMessage(err))
    } finally {
      setSavingBalance(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/accounts"
          viewTransition
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Contas
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <ValuesVisibilityToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-9" aria-label="Mais opções" title="Mais opções">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="size-4" />
                Editar conta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeletingAccount(true)} className="text-destructive">
                <Trash2 className="size-4" />
                Excluir conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card
        className="relative flex flex-row items-center justify-between gap-3 overflow-hidden border-transparent p-4 text-white ring-1 ring-black/10"
        style={{ background: `linear-gradient(150deg, ${account.color || "#6B7280"} 0%, rgba(0,0,0,0.5) 160%)` }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <AccountAvatar account={account} className="size-9 shrink-0 ring-1 ring-white/30" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight tracking-tight drop-shadow sm:text-lg">
              {account.name}
            </h1>
            <p className="mt-0.5 truncate text-xs text-white/80 drop-shadow">
              Débitos do mês <MoneyValue value={account.monthlyDebitTotal} className="font-semibold text-white" />
              {account.purchases.length > 0 &&
                ` · ${account.purchases.length} ${account.purchases.length === 1 ? "compra" : "compras"}`}
            </p>
          </div>
        </div>

        {editingBalance ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <MoneyInput
              value={balanceDraft}
              onValueChange={setBalanceDraft}
              className="h-9 w-28 text-right text-base font-bold text-foreground sm:w-32"
            />
            <Button
              size="icon"
              className="size-8 shrink-0 bg-white text-black hover:bg-white/90"
              onClick={saveBalance}
              disabled={savingBalance}
              aria-label="Salvar saldo"
            >
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-white hover:bg-white/15 hover:text-white"
              onClick={() => setEditingBalance(false)}
              disabled={savingBalance}
              aria-label="Cancelar"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditBalance}
            title="Toque para ajustar o saldo"
            className="group/bal flex shrink-0 items-center gap-1.5 text-right"
          >
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/70">Saldo atual</span>
              <MoneyValue
                value={account.balance}
                className="text-2xl font-bold tracking-tight tabular-nums drop-shadow"
              />
            </span>
            <Pencil className="size-3.5 shrink-0 text-white/70 opacity-0 transition-opacity group-hover/bal:opacity-100 [@media(hover:none)]:opacity-100" />
          </button>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <ShoppingBag className="size-4 shrink-0 text-red-500" />
            <span className="truncate text-sm font-semibold">Compras no débito</span>
            {account.purchases.length > 0 && (
              <span className="shrink-0 text-xs text-muted-foreground">({account.purchases.length})</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setIsClearingPurchases(true)}
              aria-label="Limpar compras no débito"
              title="Limpar compras no débito"
              disabled={account.purchases.length === 0}
            >
              <Eraser className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setPurchaseDialog({ mode: "create" })}
              aria-label="Nova compra"
              title="Nova compra"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        {account.purchases.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma compra lançada.</p>
        ) : (
          <ul className="scrollbar-hide -mx-2 flex max-h-[26rem] flex-col gap-1 overflow-y-auto px-2">
            {account.purchases.map((purchase) => (
              <li
                key={purchase.id}
                className="group relative flex flex-col gap-1 rounded-md px-2 py-2 hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-3"
              >
                <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <ShoppingBag className="size-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="min-w-0 truncate font-medium" title={purchase.name}>
                        {purchase.name}
                      </p>
                      <CategoryChip categoryId={purchase.categoryId} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(`${purchase.date}T00:00:00`))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pl-12 sm:contents sm:pl-0">
                  <MoneyValue
                    value={purchase.amount}
                    className="shrink-0 font-medium tabular-nums"
                  />
                  <div className="flex shrink-0 items-center sm:hidden sm:group-hover:flex sm:focus-within:flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Editar compra"
                      onClick={() => setPurchaseDialog({ mode: "edit", purchase })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Remover compra"
                      onClick={() => handleDeletePurchase(purchase.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AccountFormDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        initial={{
          name: account.name,
          color: account.color ?? "",
          imageUrl: account.imageUrl ?? "",
          balance: account.balance,
          agency: account.agency ?? "",
          accountNumber: account.accountNumber ?? "",
          accountType: account.accountType ?? "",
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

      <ClearAccountPurchasesDialog
        open={isClearingPurchases}
        onOpenChange={setIsClearingPurchases}
        account={account}
      />

      <ConfirmDialog
        open={isDeletingAccount}
        onOpenChange={setIsDeletingAccount}
        title="Remover conta"
        description={
          <>
            Remover a conta <strong>{account.name}</strong> e todas as suas compras? Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Remover"
        destructive
        onConfirm={handleDeleteAccount}
      />
    </div>
  )
}
