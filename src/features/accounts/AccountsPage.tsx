import { useEffect, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { DragHandle } from "@/components/DragHandle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { useReorder } from "@/lib/useReorder"
import { AccountFormDialog } from "./components/AccountFormDialog"
import { AccountTile } from "./components/AccountTile"
import { useAccountsStore } from "./store"

export function AccountsPage() {
  const accounts = useAccountsStore((s) => s.accounts)
  const totalBalance = useAccountsStore((s) => s.totalBalance)
  const isLoading = useAccountsStore((s) => s.isLoading)
  const error = useAccountsStore((s) => s.error)
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)
  const createAccount = useAccountsStore((s) => s.createAccount)
  const reorderAccounts = useAccountsStore((s) => s.reorderAccounts)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { order, draggingId, getItemProps, getHandleProps } = useReorder(accounts, reorderAccounts)

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardDescription>Saldo total das contas</CardDescription>
            <CardTitle className="text-2xl">
              <MoneyValue value={totalBalance} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Nova conta
        </Button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Nenhuma conta cadastrada ainda.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {order.map((account) => (
            <li
              key={account.id}
              {...getItemProps(account.id)}
              className={cn("group relative transition-opacity", draggingId === account.id && "opacity-40")}
            >
              <DragHandle
                {...getHandleProps(account.id)}
                className="absolute right-2 top-2 z-10 rounded-md bg-black/25 p-1 text-white opacity-0 backdrop-blur-sm hover:bg-black/40 hover:text-white group-hover:opacity-100"
              />
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
    </div>
  )
}
