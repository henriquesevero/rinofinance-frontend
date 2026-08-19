import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Loader2, Pencil, Plus } from "lucide-react"
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
import { AccountCarousel } from "./components/AccountCarousel"
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
  const [activeIndex, setActiveIndex] = useState(0)
  const { order, draggingId, getItemProps, getHandleProps } = useReorder(accounts, reorderAccounts)
  const totalDebits = useMemo(() => accounts.reduce((sum, a) => sum + a.monthlyDebitTotal, 0), [accounts])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts, month])

  useEffect(() => {
    if (activeIndex >= accounts.length) setActiveIndex(Math.max(0, accounts.length - 1))
  }, [accounts.length, activeIndex])

  const activeAccount = accounts[activeIndex] ?? null

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
          <h1 className="text-3xl font-extrabold tracking-tight">Contas</h1>
          <p className="hidden text-muted-foreground sm:block">Seus saldos e compras no débito.</p>
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

      {accounts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Nenhuma conta cadastrada ainda.</p>
      ) : (
        <>
          {/* Mobile: swipeable carousel with per-account balance/debits info */}
          <div className="flex flex-col gap-6 md:hidden">
            <AccountCarousel
              accounts={accounts}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              onEditAccount={setEditingAccount}
            />

            {activeAccount && (
              <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
                <Link
                  to={`/accounts/${activeAccount.id}`}
                  viewTransition
                  className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50"
                >
                  <span className="text-sm font-medium">Saldo</span>
                  <span className="flex items-center gap-1.5">
                    <MoneyValue
                      value={activeAccount.balance}
                      className={cn(
                        "font-bold tabular-nums",
                        activeAccount.balance >= 0 ? "text-emerald-500" : "text-red-500"
                      )}
                    />
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </span>
                </Link>

                <Card className="gap-3 p-4 sm:p-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Débitos do mês
                    </p>
                    <MoneyValue
                      value={activeAccount.monthlyDebitTotal}
                      className="text-2xl font-bold tracking-tight tabular-nums text-red-500"
                    />
                    <p className="text-xs text-muted-foreground">compras no débito deste mês</p>
                  </div>

                  <Link
                    to={`/accounts/${activeAccount.id}`}
                    viewTransition
                    className="mt-1 flex w-full items-center justify-center rounded-full border border-primary/30 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                  >
                    Ver conta completa
                  </Link>
                </Card>

                <Card className="gap-3 p-4 sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Dados da conta
                  </p>

                  {!activeAccount.agency && !activeAccount.accountNumber && !activeAccount.accountType ? (
                    <p className="text-sm text-muted-foreground">Nenhum dado cadastrado.</p>
                  ) : (
                    <div className="flex flex-col divide-y divide-border">
                      {activeAccount.accountType && (
                        <div className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                          <span className="text-sm text-muted-foreground">Tipo de conta</span>
                          <span className="text-sm font-medium">{activeAccount.accountType}</span>
                        </div>
                      )}
                      {activeAccount.agency && (
                        <div className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                          <span className="text-sm text-muted-foreground">Agência</span>
                          <span className="text-sm font-medium tabular-nums">{activeAccount.agency}</span>
                        </div>
                      )}
                      {activeAccount.accountNumber && (
                        <div className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                          <span className="text-sm text-muted-foreground">Número da conta</span>
                          <span className="text-sm font-medium tabular-nums">{activeAccount.accountNumber}</span>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>

          {/* Desktop: aggregate summary + reorderable grid */}
          <div className="hidden flex-col gap-6 md:flex">
            <Card className="gap-0 overflow-hidden p-0">
              <div className="grid gap-px bg-border sm:grid-cols-2">
                <div className="flex flex-col justify-center gap-0.5 bg-card p-4 sm:gap-1 sm:p-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Saldo total
                  </span>
                  <MoneyValue
                    value={totalBalance}
                    className={cn(
                      "text-xl font-bold tracking-tight tabular-nums sm:text-2xl",
                      totalBalance < 0 ? "text-red-500" : "text-emerald-500"
                    )}
                  />
                  <span className="text-xs text-muted-foreground">somado de todas as contas</span>
                </div>
                <div className="flex flex-col justify-center gap-0.5 bg-card p-4 sm:gap-1 sm:p-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Débitos do mês
                  </span>
                  <MoneyValue
                    value={totalDebits}
                    className="text-xl font-bold tracking-tight tabular-nums text-red-500 sm:text-2xl"
                  />
                  <span className="text-xs text-muted-foreground">compras no débito deste mês</span>
                </div>
              </div>
            </Card>

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {order.map((account) => (
                <li
                  key={account.id}
                  {...getItemProps(account.id)}
                  className={cn("group relative transition-opacity", draggingId === account.id && "opacity-40")}
                >
                  <DragHandle
                    {...getHandleProps(account.id)}
                    className="absolute right-10 top-2 z-10 rounded-md bg-black/25 p-1 text-white opacity-0 backdrop-blur-sm hover:bg-black/40 hover:text-white group-hover:opacity-100"
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
                    className="absolute right-2 top-2 z-10 rounded-md bg-black/25 p-1 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/40 group-hover:opacity-100"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <AccountTile account={account} />
                </li>
              ))}
            </ul>
          </div>
        </>
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
                agency: editingAccount.agency ?? "",
                accountNumber: editingAccount.accountNumber ?? "",
                accountType: editingAccount.accountType ?? "",
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
