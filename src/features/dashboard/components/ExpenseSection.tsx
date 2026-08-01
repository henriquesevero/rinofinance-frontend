import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Check, ChevronDown, CreditCard, MoreHorizontal, Pencil, Plus, Power, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { BulkActionsMenu } from "@/components/BulkActionsMenu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DragHandle } from "@/components/DragHandle"
import { useCardsStore } from "@/features/cards/store"
import { AccountChip } from "@/features/accounts/components/AccountChip"
import { useAccountsStore } from "@/features/accounts/store"
import { CategoryChip } from "@/features/categories/components/CategoryChip"
import { useCategoriesStore } from "@/features/categories/store"
import { toErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import { useReorder } from "@/lib/useReorder"
import { useDashboardStore } from "../store"
import type { EntriesFilters } from "../EntriesPage"
import type { Expense } from "../types"
import { ExpenseFormDialog } from "./ExpenseFormDialog"

type DialogState = { mode: "create" } | { mode: "edit"; expense: Expense } | null

type ExpenseSortKey = "default" | "amount-desc" | "amount-asc"

const EXPENSE_SORT_OPTIONS: { value: ExpenseSortKey; label: string }[] = [
  { value: "default", label: "Ordem padrão" },
  { value: "amount-desc", label: "Maior valor" },
  { value: "amount-asc", label: "Menor valor" },
]

function sortExpenses(list: Expense[], key: ExpenseSortKey): Expense[] {
  if (key === "default") return list
  const sorted = [...list]
  return key === "amount-desc"
    ? sorted.sort((a, b) => b.amount - a.amount)
    : sorted.sort((a, b) => a.amount - b.amount)
}

export function ExpenseSection({ expenses, filters }: { expenses: Expense[]; filters: EntriesFilters }) {
  const [dialogState, setDialogState] = useState<DialogState>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [sortKey, setSortKey] = useState<ExpenseSortKey>("default")
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
  const categoryById = useCategoriesStore((s) => s.byId)

  useEffect(() => {
    fetchCards()
    fetchAccounts()
  }, [fetchCards, fetchAccounts])

  const visible = useMemo(() => {
    const term = filters.search.trim().toLowerCase()
    const filtered = expenses.filter(
      (e) =>
        (!term || e.name.toLowerCase().includes(term)) &&
        (!filters.pendingOnly || !e.paid) &&
        (!filters.categoryId || e.categoryId === filters.categoryId)
    )
    return sortExpenses(filtered, sortKey)
  }, [expenses, filters, sortKey])

  const canReorder =
    sortKey === "default" && !filters.search && !filters.pendingOnly && !filters.categoryId && !filters.groupBy
  const { order, draggingId, getItemProps, getHandleProps } = useReorder(visible, reorderExpenses)
  const rows = canReorder ? order : visible

  const groups = useMemo(() => {
    if (!filters.groupBy) return null
    const map = new Map<string, Expense[]>()
    for (const e of visible) {
      const key = e.categoryId || "__none__"
      const list = map.get(key)
      if (list) list.push(e)
      else map.set(key, [e])
    }
    return [...map.entries()]
      .map(([id, items]) => ({
        id,
        name: id === "__none__" ? "Sem categoria" : categoryById(id)?.name ?? "Sem categoria",
        items,
        subtotal: items.reduce((s, x) => s + x.amount, 0),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [visible, filters.groupBy, categoryById])

  async function runBulk(action: () => Promise<void>) {
    try {
      await action()
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  function cardName(cardId?: string) {
    return cards.find((c) => c.id === cardId)?.name ?? "Cartão"
  }

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

  function renderRow(expense: Expense, withHandle: boolean) {
    const accent = linkColor(expense)
    const cardColor = expense.cardId ? cards.find((c) => c.id === expense.cardId)?.color : undefined
    const hasMeta = Boolean(expense.categoryId || expense.accountId || expense.cardId)
    return (
      <li
        key={expense.id}
        {...(withHandle ? getItemProps(expense.id) : {})}
        style={accent ? { borderLeftColor: accent } : undefined}
        className={cn(
          "group relative flex flex-col gap-1 border-l-2 border-l-transparent py-1.5 pl-2 text-sm sm:flex-row sm:items-center sm:gap-3 sm:py-2 sm:pr-1",
          !expense.active && "opacity-55",
          draggingId === expense.id && "opacity-40"
        )}
      >
        <div className="flex min-w-0 items-center gap-2 sm:flex-1 sm:gap-3">
          {/* Fixed-width handle slot, reserved even when reordering is off
              (filtered/grouped), so rows never shift left between states. */}
          <div className="hidden w-4 shrink-0 sm:block">
            {withHandle && (
              <DragHandle
                {...getHandleProps(expense.id)}
                className="opacity-0 group-hover:opacity-100"
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => handleTogglePaid(expense.id)}
            aria-label={expense.paid ? "Marcar como não paga" : "Marcar como paga"}
            title={expense.paid ? "Paga (desmarcar)" : "Marcar paga"}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150 active:scale-90",
              expense.paid
                ? "border-red-500 bg-red-500 text-white"
                : "border-muted-foreground/30 text-white hover:border-red-500"
            )}
          >
            <Check
              className={cn(
                "size-3 transition-all duration-200",
                expense.paid ? "scale-100 opacity-100" : "scale-0 opacity-0"
              )}
              strokeWidth={3}
            />
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
          <MoneyValue value={expense.amount} className="shrink-0 font-semibold tabular-nums text-red-500" />
          <div className="flex shrink-0 items-center sm:hidden sm:group-hover:flex sm:focus-within:flex">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Ações da saída" title="Ações">
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleToggle(expense.id)}>
                  <Power className={cn("size-4", expense.active ? "text-emerald-500" : "text-muted-foreground/50")} />
                  {expense.active ? "Desativar" : "Ativar"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialogState({ mode: "edit", expense })}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(expense.id)} className="text-destructive">
                  <Trash2 className="size-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </li>
    )
  }

  return (
    <Card className="[--card-spacing:--spacing(3)] sm:[--card-spacing:--spacing(4)]">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex min-w-0 items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", collapsed && "-rotate-90")}
          />
          <span className="size-2.5 shrink-0 rounded-full bg-red-500" />
          <CardTitle className="truncate">Saídas do mês</CardTitle>
        </button>
        <div className="flex shrink-0 items-center gap-1">
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
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <ArrowUpRight className="size-5" />
              </span>
              <p className="text-sm text-muted-foreground">Nenhuma saída ainda.</p>
              <Button variant="outline" size="sm" onClick={() => setDialogState({ mode: "create" })}>
                <Plus className="size-4" />
                Adicionar saída
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma saída encontrada.</p>
          ) : groups ? (
            <div className="scrollbar-hide flex max-h-[20rem] flex-col gap-4 overflow-y-auto sm:max-h-[26rem]">
              {groups.map((g) => (
                <div key={g.id}>
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {g.name}
                    </span>
                    <MoneyValue value={g.subtotal} className="shrink-0 text-xs font-semibold tabular-nums text-red-500" />
                  </div>
                  <ul className="divide-y">{g.items.map((e) => renderRow(e, false))}</ul>
                </div>
              ))}
            </div>
          ) : (
            <ul className="scrollbar-hide max-h-[20rem] divide-y overflow-y-auto sm:max-h-[26rem]">
              {rows.map((e) => renderRow(e, canReorder))}
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
