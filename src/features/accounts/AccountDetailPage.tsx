import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowDownLeft, ArrowLeft, Loader2, MoreHorizontal, Pencil, Plus, Receipt, ShoppingBag, Trash2, Wallet } from "lucide-react"
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
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
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
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
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

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AccountAvatar account={account} className="size-10 shrink-0" />
          <h1 className="truncate text-2xl font-bold tracking-tight">{account.name}</h1>
        </div>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Wallet}
          label="Saldo atual"
          value={<MoneyValue value={account.balance} />}
          tone={account.balance < 0 ? "danger" : "positive"}
          sub="disponível na conta"
        />
        <StatCard
          icon={ArrowDownLeft}
          label="Compras no mês"
          value={<MoneyValue value={account.monthlyDebitTotal} />}
          tone="danger"
          sub="débitos deste mês"
        />
        <StatCard
          icon={Receipt}
          label="Lançamentos"
          value={String(account.purchases.length)}
          sub="compras registradas"
        />
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <ShoppingBag className="size-4 shrink-0 text-red-500" />
            <span className="truncate text-sm font-semibold">Compras no débito</span>
            {account.purchases.length > 0 && (
              <span className="shrink-0 text-xs text-muted-foreground">({account.purchases.length})</span>
            )}
          </div>
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
                    className="shrink-0 font-medium tabular-nums sm:transition-opacity sm:group-hover:opacity-0"
                  />
                  <div className="flex shrink-0 items-center sm:absolute sm:inset-y-0 sm:right-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
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

// A single metric tile in the account's stat grid — same shape as the card
// detail page's stats: icon + uppercase label + prominent value + sub-line.
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Wallet
  label: string
  value: React.ReactNode
  sub?: string
  tone?: "positive" | "danger"
}) {
  const toneClass = tone === "positive" ? "text-emerald-500" : tone === "danger" ? "text-red-500" : ""
  return (
    <Card className="flex flex-col gap-1 p-3.5">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("size-3", toneClass || "text-muted-foreground")} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <div className={cn("text-lg font-bold tracking-tight tabular-nums", toneClass)}>{value}</div>
      {sub && <p className="text-[11px] leading-tight text-muted-foreground">{sub}</p>}
    </Card>
  )
}
