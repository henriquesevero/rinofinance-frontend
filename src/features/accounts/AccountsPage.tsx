import { useEffect, useState } from "react"
import { Cable, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DragHandle } from "@/components/DragHandle"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { useReorder } from "@/lib/useReorder"
import { useMonthStore } from "@/lib/monthStore"
import { AccountFormDialog } from "./components/AccountFormDialog"
import { AccountTile } from "./components/AccountTile"
import { useAccountsStore } from "./store"

export function AccountsPage() {
  const accounts = useAccountsStore((s) => s.accounts)
  const isLoading = useAccountsStore((s) => s.isLoading)
  const error = useAccountsStore((s) => s.error)
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)
  const createAccount = useAccountsStore((s) => s.createAccount)
  const reorderAccounts = useAccountsStore((s) => s.reorderAccounts)
  const month = useMonthStore((s) => s.month)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas</h1>
          <p className="text-muted-foreground">Conecte, visualize e gerencie suas conexões financeiras.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ValuesVisibilityToggle />
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" />
            Nova conta
          </Button>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <Cable className="size-5 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Conexões</h2>
          {accounts.length > 0 && (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
              {accounts.length} {accounts.length === 1 ? "ativa" : "ativas"}
            </span>
          )}
        </div>

        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada ainda.</p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                <AccountTile account={account} />
              </li>
            ))}
          </ul>
        )}
      </section>

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
    </div>
  )
}
