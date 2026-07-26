import { useEffect, useState } from "react"
import { ArrowDownLeft, Check, ChevronDown, Pencil, Plus, Power, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { BulkActionsMenu } from "@/components/BulkActionsMenu"
import { DragHandle } from "@/components/DragHandle"
import { toErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import { useReorder } from "@/lib/useReorder"
import { AccountChip } from "@/features/accounts/components/AccountChip"
import { useAccountsStore } from "@/features/accounts/store"
import { CategoryChip } from "@/features/categories/components/CategoryChip"
import { useDashboardStore } from "../store"
import type { Income } from "../types"
import { IncomeFormDialog } from "./IncomeFormDialog"

type DialogState = { mode: "create" } | { mode: "edit"; income: Income } | null

export function IncomeSection({ incomes }: { incomes: Income[] }) {
  const [dialogState, setDialogState] = useState<DialogState>(null)
  const [collapsed, setCollapsed] = useState(false)
  const createIncome = useDashboardStore((s) => s.createIncome)
  const createAccountLinkedIncome = useDashboardStore((s) => s.createAccountLinkedIncome)
  const updateIncome = useDashboardStore((s) => s.updateIncome)
  const toggleIncome = useDashboardStore((s) => s.toggleIncome)
  const toggleIncomeReceived = useDashboardStore((s) => s.toggleIncomeReceived)
  const deleteIncome = useDashboardStore((s) => s.deleteIncome)
  const reorderIncomes = useDashboardStore((s) => s.reorderIncomes)
  const setAllActive = useDashboardStore((s) => s.setAllIncomesActive)
  const setAllReceived = useDashboardStore((s) => s.setAllIncomesReceived)
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)
  const { order, draggingId, getItemProps, getHandleProps } = useReorder(incomes, reorderIncomes)

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  async function runBulk(action: () => Promise<void>) {
    try {
      await action()
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleSubmit(name: string, amount: number, categoryId: string) {
    if (dialogState?.mode === "edit") {
      await updateIncome(dialogState.income.id, name, amount, categoryId)
      toast.success("Entrada atualizada")
    } else {
      await createIncome(name, amount, categoryId)
      toast.success("Entrada criada")
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleIncome(id)
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleToggleReceived(id: string) {
    try {
      await toggleIncomeReceived(id)
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteIncome(id)
      toast.success("Entrada removida")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  return (
    <Card className="border-l-4 border-l-emerald-500/60">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", collapsed && "-rotate-90")}
          />
          <CardTitle>Entradas do mês</CardTitle>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {incomes.length > 0 && (
            <BulkActionsMenu
              groups={[
                {
                  label: "Recebido",
                  actions: [
                    { label: "Marcar todas", run: () => runBulk(() => setAllReceived(true)) },
                    { label: "Desmarcar todas", run: () => runBulk(() => setAllReceived(false)) },
                  ],
                },
                {
                  label: "Ativo",
                  actions: [
                    { label: "Marcar todas", run: () => runBulk(() => setAllActive(true)) },
                    { label: "Desmarcar todas", run: () => runBulk(() => setAllActive(false)) },
                  ],
                },
              ]}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setDialogState({ mode: "create" })}
            aria-label="Nova entrada"
            title="Nova entrada"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </CardHeader>
      {!collapsed && (
      <CardContent>
        {incomes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma entrada cadastrada ainda.</p>
        ) : (
          <ul className="max-h-[26rem] divide-y overflow-y-auto">
            {order.map((income) => {
              const hasMeta = Boolean(income.categoryId || income.accountId)
              return (
                <li
                  key={income.id}
                  {...getItemProps(income.id)}
                  className={cn(
                    "group relative flex flex-col gap-1 py-2 text-sm sm:flex-row sm:items-center sm:gap-3 sm:pr-1",
                    !income.active && "opacity-55",
                    draggingId === income.id && "opacity-40"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2 sm:flex-1 sm:gap-3">
                    <DragHandle
                      {...getHandleProps(income.id)}
                      className="hidden shrink-0 opacity-0 group-hover:opacity-100 sm:block"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleReceived(income.id)}
                      aria-label={income.received ? "Marcar como não recebida" : "Marcar como recebida"}
                      title={income.received ? "Recebida (desmarcar)" : "Marcar recebida"}
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                        income.received
                          ? "bg-emerald-500 text-white"
                          : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      )}
                    >
                      {income.received ? <Check className="size-4" /> : <ArrowDownLeft className="size-4" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate leading-tight" title={income.name}>
                        {income.name}
                      </p>
                      {hasMeta && (
                        <div className="mt-0.5 flex items-center gap-x-1.5 overflow-hidden text-xs leading-tight text-muted-foreground [&>*+*]:before:mr-1.5 [&>*+*]:before:text-muted-foreground/40 [&>*+*]:before:content-['·']">
                          <CategoryChip categoryId={income.categoryId} dense />
                          <AccountChip accountId={income.accountId} dense />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pl-7 sm:contents sm:pl-0">
                    <MoneyValue
                      value={income.amount}
                      className="shrink-0 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 sm:transition-opacity sm:group-hover:opacity-0"
                    />
                    <div className="flex shrink-0 items-center sm:absolute sm:inset-y-0 sm:right-1 sm:bg-card sm:pl-6 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleToggle(income.id)}
                        aria-label={income.active ? "Desativar entrada" : "Ativar entrada"}
                        title={income.active ? "Ativa (desativar)" : "Inativa (ativar)"}
                        className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Power className={cn("size-4", income.active ? "text-emerald-500" : "text-muted-foreground/50")} />
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Editar entrada"
                        onClick={() => setDialogState({ mode: "edit", income })}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Remover entrada"
                        onClick={() => handleDelete(income.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
      )}

      <IncomeFormDialog
        open={dialogState !== null}
        onOpenChange={(open) => !open && setDialogState(null)}
        income={dialogState?.mode === "edit" ? dialogState.income : undefined}
        onSubmit={handleSubmit}
        onSubmitAccountLinked={async (name, accountId, categoryId) => {
          await createAccountLinkedIncome(name, accountId, categoryId)
          toast.success("Entrada vinculada à conta criada")
        }}
      />
    </Card>
  )
}
