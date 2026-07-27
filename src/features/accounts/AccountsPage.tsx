import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DragHandle } from "@/components/DragHandle"
import { MoneyValue } from "@/components/MoneyValue"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { useReorder } from "@/lib/useReorder"
import { useMonthStore } from "@/lib/monthStore"
import { AccountFormDialog } from "./components/AccountFormDialog"
import { AccountTile } from "./components/AccountTile"
import { useAccountsStore } from "./store"
import type { Account } from "./types"

export function AccountsPage() {
  const accounts = useAccountsStore((s) => s.accounts)
  const totalBalance = useAccountsStore((s) => s.totalBalance)
  const isLoading = useAccountsStore((s) => s.isLoading)
  const error = useAccountsStore((s) => s.error)
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)
  const createAccount = useAccountsStore((s) => s.createAccount)
  const updateAccount = useAccountsStore((s) => s.updateAccount)
  const reorderAccounts = useAccountsStore((s) => s.reorderAccounts)
  const month = useMonthStore((s) => s.month)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const { order, draggingId, getItemProps, getHandleProps } = useReorder(accounts, reorderAccounts)

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts, month])

  if (isLoading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Carregando contas...
      </div>
    )
  }

  if (error && accounts.length === 0) {
    return <p className="text-center text-destructive">{error}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas</h1>
          <p className="text-muted-foreground">Conecte, visualize e gerencie suas conexões financeiras.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ValuesVisibilityToggle />
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => setIsCreateOpen(true)}
            aria-label="Nova conta"
            title="Nova conta"
          >
            <Plus className="size-5" />
          </Button>
        </div>
      </div>

      {/* saldo total — compacto e discreto */}
      <Card className="flex w-full flex-col gap-1 p-4 sm:max-w-[13rem]">
        <div className="flex items-center gap-1.5">
          <Wallet className="size-3.5 text-emerald-500" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Saldo total</h2>
        </div>
        <MoneyValue value={totalBalance} className="text-xl font-bold tracking-tight tabular-nums text-emerald-500" />
      </Card>

      {order.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Nenhuma conta cadastrada ainda.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {order.map((account) => (
            <li
              key={account.id}
              {...getItemProps(account.id)}
              className={cn("group relative transition-opacity", draggingId === account.id && "opacity-40")}
            >
              <DragHandle
                {...getHandleProps(account.id)}
                className="absolute left-3 top-3 z-10 rounded-md bg-black/25 p-1 text-white opacity-0 backdrop-blur-sm hover:bg-black/40 hover:text-white group-hover:opacity-100"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setEditingAccount(account)
                }}
                title="Editar conta"
                aria-label="Editar conta"
                className="absolute right-3 top-3 z-10 rounded-md bg-black/25 p-1 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/40 group-hover:opacity-100"
              >
                <Pencil className="size-4" />
              </button>
              <AccountTile account={account} />
            </li>
          ))}
        </ul>
      )}

      <AccountFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={async (input) => {
          try {
            await createAccount(input)
            toast.success("Conta criada")
          } catch (err) {
            toast.error(toErrorMessage(err))
            throw err
          }
        }}
      />

      <AccountFormDialog
        open={editingAccount !== null}
        onOpenChange={(open) => !open && setEditingAccount(null)}
        initial={
          editingAccount
            ? {
                name: editingAccount.name,
                color: editingAccount.color ?? "",
                imageUrl: editingAccount.imageUrl ?? "",
                balance: editingAccount.balance,
              }
            : undefined
        }
        onSubmit={async (input) => {
          if (!editingAccount) return
          try {
            await updateAccount(editingAccount.id, input)
            toast.success("Conta atualizada")
          } catch (err) {
            toast.error(toErrorMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
