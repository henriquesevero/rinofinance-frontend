import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Check, ChevronDown, CreditCard, Pencil, Plus, Power, Trash2 } from "lucide-react"
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

type ExpenseSortKey = "default" | "amount-desc" | "amount-asc"

const EXPENSE_SORT_OPTIONS: { value: ExpenseSortKey; label: string }[] = [
  { value: "default", label: "Ordem padrão" },
  { value: "amount-desc", label: "Maior valor" },
  { value: "amount-asc", label: "Menor valor" },
]

// Returns a new sorted array; "default" preserves the manual (reorder) order.
function sortExpenses(list: Expense[], key: ExpenseSortKey): Expense[] {
  if (key === "default") return list
  const sorted = [...list]
  return key === "amount-desc"
    ? sorted.sort((a, b) => b.amount - a.amount)
    : sorted.sort((a, b) => a.amount - b.amount)
}

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
  const [sortKey, setSortKey] = useState<ExpenseSortKey>("default")
  // Sorting is a computed view, so manual drag-reorder only applies to the
  // default order.
  const canReorder = sortKey === "default"
  const visible = useMemo(() => sortExpenses(order, sortKey), [order, sortKey])

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
    <Card>
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
          <CardTitle>Saídas do mês</CardTitle>
        </button>
        <div className="flex items-center gap-1">
          {expenses.length > 0 && (
            <BulkActionsMenu
              sort={
                expenses.length > 1
                  ? {
                      value: sortKey,
                      onChange: (v) => setSortKey((v as ExpenseSortKey) ?? "default"),
                      options: EXPENSE_SORT_OPTIONS,
                    }
                  : undefined
              }
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
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setDialogState({ mode: "create" })}
            aria-label="Nova saída"
            title="Nova saída"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </CardHeader>
      {!collapsed && (
      <CardContent>
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma saída cadastrada ainda.</p>
        ) : (
          <ul className="scrollbar-hide max-h-[26rem] divide-y overflow-y-auto">
            {visible.map((expense) => {
              const accent = linkColor(expense)
              const cardColor = expense.cardId ? cards.find((c) => c.id === expense.cardId)?.color : undefined
              const hasMeta = Boolean(expense.categoryId || expense.accountId || expense.cardId)
              return (
                <li
                  key={expense.id}
                  {...getItemProps(expense.id)}
                  style={accent ? { borderLeftColor: accent } : undefined}
                  className={cn(
                    "group relative flex flex-col gap-1 border-l-2 border-l-transparent py-2 pl-2 text-sm sm:flex-row sm:items-center sm:gap-3 sm:pr-1",
                    !expense.active && "opacity-55",
                    draggingId === expense.id && "opacity-40"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2 sm:flex-1 sm:gap-3">
                    {canReorder && (
                      <DragHandle
                        {...getHandleProps(expense.id)}
                        className="hidden shrink-0 opacity-0 group-hover:opacity-100 sm:block"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleTogglePaid(expense.id)}
                      aria-label={expense.paid ? "Marcar como não paga" : "Marcar como paga"}
                      title={expense.paid ? "Paga (desmarcar)" : "Marcar paga"}
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                        expense.paid
                          ? "bg-emerald-500 text-white"
                          : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      )}
                    >
                      {expense.paid ? <Check className="size-4" /> : <ArrowUpRight className="size-4" />}
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
                  </div>
                  <div className="flex items-center justify-between gap-2 pl-7 sm:contents sm:pl-0">
                    <MoneyValue
                      value={expense.amount}
                      className="shrink-0 font-semibold tabular-nums text-red-600 dark:text-red-400 sm:transition-opacity sm:group-hover:opacity-0"
                    />
                    <div className="flex shrink-0 items-center sm:absolute sm:inset-y-0 sm:right-1 sm:bg-card sm:pl-6 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleToggle(expense.id)}
                        aria-label={expense.active ? "Desativar saída" : "Ativar saída"}
                        title={expense.active ? "Ativa (desativar)" : "Inativa (ativar)"}
                        className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Power className={cn("size-4", expense.active ? "text-emerald-500" : "text-muted-foreground/50")} />
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Editar saída"
                        onClick={() => setDialogState({ mode: "edit", expense })}
                      >
                        <Pencil className="size-4" />
                      </Button>
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
