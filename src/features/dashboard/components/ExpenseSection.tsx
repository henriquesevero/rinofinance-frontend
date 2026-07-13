import { useEffect, useState } from "react"
import { CheckCircle2, ChevronDown, Circle, CreditCard, Pencil, Plus, Power, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { BulkActionsMenu } from "@/components/BulkActionsMenu"
import { DragHandle } from "@/components/DragHandle"
import { useCardsStore } from "@/features/cards/store"
import { AccountChip } from "@/features/accounts/components/AccountChip"
import { useAccountsStore } from "@/features/accounts/store"
import { CategoryChip } from "@/features/categories/components/CategoryChip"
import { toErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import { useReorder } from "@/lib/useReorder"
import { useDashboardStore } from "../store"
import type { Expense } from "../types"
import { ExpenseFormDialog } from "./ExpenseFormDialog"

type DialogState = { mode: "create" } | { mode: "edit"; expense: Expense } | null

export function ExpenseSection({ expenses }: { expenses: Expense[] }) {
  const [dialogState, setDialogState] = useState<DialogState>(null)
  const [collapsed, setCollapsed] = useState(false)
  const cards = useCardsStore((s) => s.cards)
  const fetchCards = useCardsStore((s) => s.fetchCards)
  const createExpense = useDashboardStore((s) => s.createExpense)
  const createCardLinkedExpense = useDashboardStore((s) => s.createCardLinkedExpense)
  const createAccountLinkedExpense = useDashboardStore((s) => s.createAccountLinkedExpense)
  const updateExpense = useDashboardStore((s) => s.updateExpense)
  const toggleExpense = useDashboardStore((s) => s.toggleExpense)
  const toggleExpensePaid = useDashboardStore((s) => s.toggleExpensePaid)
  const deleteExpense = useDashboardStore((s) => s.deleteExpense)
  const reorderExpenses = useDashboardStore((s) => s.reorderExpenses)
  const setAllActive = useDashboardStore((s) => s.setAllExpensesActive)
  const setAllPaid = useDashboardStore((s) => s.setAllExpensesPaid)
  const accounts = useAccountsStore((s) => s.accounts)
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)
  const { order, draggingId, getItemProps, getHandleProps } = useReorder(expenses, reorderExpenses)

  async function runBulk(action: () => Promise<void>) {
    try {
      await action()
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  useEffect(() => {
    fetchCards()
    fetchAccounts()
  }, [fetchCards, fetchAccounts])

  function cardName(cardId?: string) {
    return cards.find((c) => c.id === cardId)?.name ?? "Cartão"
  }

  // The accent color of a linked expense: the card's or account's color, so
  // the row carries a discreet stripe matching its source.
  function linkColor(expense: Expense): string | undefined {
    if (expense.cardId) return cards.find((c) => c.id === expense.cardId)?.color
    if (expense.accountId) return accounts.find((a) => a.id === expense.accountId)?.color
    return undefined
  }

  async function handleToggle(id: string) {
    try {
      await toggleExpense(id)
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleTogglePaid(id: string) {
    try {
      await toggleExpensePaid(id)
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteExpense(id)
      toast.success("Saída removida")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  return (
    <Card className="border-l-4 border-l-red-500/60">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", collapsed && "-rotate-90")}
          />
          <CardTitle>Saídas do mês</CardTitle>
        </button>
        <div className="flex items-center gap-2">
          {expenses.length > 0 && (
            <BulkActionsMenu
              groups={[
                {
                  label: "Pago",
                  actions: [
                    { label: "Marcar todas", run: () => runBulk(() => setAllPaid(true)) },
                    { label: "Desmarcar todas", run: () => runBulk(() => setAllPaid(false)) },
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
          <Button size="sm" onClick={() => setDialogState({ mode: "create" })}>
            <Plus className="size-4" />
            Nova saída
          </Button>
        </div>
      </CardHeader>
      {!collapsed && (
      <CardContent>
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma saída cadastrada ainda.</p>
        ) : (
          <ul className="divide-y">
            {order.map((expense) => {
              const accent = linkColor(expense)
              const cardColor = expense.cardId ? cards.find((c) => c.id === expense.cardId)?.color : undefined
              const hasMeta = Boolean(expense.categoryId || expense.accountId || expense.cardId)
              return (
                <li
                  key={expense.id}
                  {...getItemProps(expense.id)}
                  style={accent ? { borderLeftColor: accent } : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 border-l-2 border-l-transparent py-2 pl-2 pr-1 text-sm",
                    !expense.active && "opacity-55",
                    draggingId === expense.id && "opacity-40"
                  )}
                >
                  <DragHandle
                    {...getHandleProps(expense.id)}
                    className="-ml-1 shrink-0 opacity-0 group-hover:opacity-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleTogglePaid(expense.id)}
                    aria-label={expense.paid ? "Marcar como não paga" : "Marcar como paga"}
                    title={expense.paid ? "Paga" : "Marcar paga"}
                    className="shrink-0 text-muted-foreground/40 transition-colors hover:text-emerald-600"
                  >
                    {expense.paid ? (
                      <CheckCircle2 className="size-5 text-emerald-500" />
                    ) : (
                      <Circle className="size-5" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate leading-tight" title={expense.name}>
                      {expense.name}
                    </p>
                    {hasMeta && (
                      <div className="mt-0.5 flex items-center gap-x-1.5 overflow-hidden text-xs leading-tight text-muted-foreground [&>*+*]:before:mr-1.5 [&>*+*]:before:text-muted-foreground/40 [&>*+*]:before:content-['·']">
                        <CategoryChip categoryId={expense.categoryId} dense />
                        <AccountChip accountId={expense.accountId} dense />
                        {expense.cardId && (
                          <span className="inline-flex shrink-0 items-center gap-1" title={cardName(expense.cardId)}>
                            <CreditCard className="size-3" style={{ color: cardColor || "#6B7280" }} />
                            {cardName(expense.cardId)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <MoneyValue
                    value={expense.amount}
                    className="shrink-0 font-medium tabular-nums transition-opacity group-hover:opacity-0 [@media(hover:none)]:opacity-100"
                  />
                  <div className="absolute inset-y-0 right-1 flex items-center bg-card pl-6 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:static [@media(hover:none)]:bg-transparent [@media(hover:none)]:pl-1 [@media(hover:none)]:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleToggle(expense.id)}
                      aria-label={expense.active ? "Desativar saída" : "Ativar saída"}
                      title={expense.active ? "Ativa (desativar)" : "Inativa (ativar)"}
                      className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <Power className={cn("size-4", expense.active ? "text-emerald-500" : "text-muted-foreground/50")} />
                    </button>
                    {!expense.cardId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Editar saída"
                        onClick={() => setDialogState({ mode: "edit", expense })}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Remover saída"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
      )}

      <ExpenseFormDialog
        open={dialogState !== null}
        onOpenChange={(open) => !open && setDialogState(null)}
        expense={dialogState?.mode === "edit" ? dialogState.expense : undefined}
        cards={cards}
        onSubmitManual={async (name, amount, categoryId) => {
          if (dialogState?.mode === "edit") {
            await updateExpense(dialogState.expense.id, name, amount, categoryId)
            toast.success("Saída atualizada")
          } else {
            await createExpense(name, amount, categoryId)
            toast.success("Saída criada")
          }
        }}
        onSubmitCardLinked={async (name, cardId, categoryId) => {
          await createCardLinkedExpense(name, cardId, categoryId)
          toast.success("Saída vinculada ao cartão criada")
        }}
        onSubmitAccountLinked={async (name, accountId, categoryId) => {
          await createAccountLinkedExpense(name, accountId, categoryId)
          toast.success("Saída vinculada à conta criada")
        }}
      />
    </Card>
  )
}
