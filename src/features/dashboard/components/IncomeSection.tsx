import { useEffect, useMemo, useState } from "react"
import { ArrowDownLeft, Check, ChevronDown, MoreHorizontal, Pencil, Plus, Power, Trash2 } from "lucide-react"
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
import { toErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import { useReorder } from "@/lib/useReorder"
import { AccountChip } from "@/features/accounts/components/AccountChip"
import { useAccountsStore } from "@/features/accounts/store"
import { CategoryChip } from "@/features/categories/components/CategoryChip"
import { useCategoriesStore } from "@/features/categories/store"
import { useDashboardStore } from "../store"
import type { EntriesFilters } from "../EntriesPage"
import type { Income } from "../types"
import { IncomeFormDialog } from "./IncomeFormDialog"

type DialogState = { mode: "create" } | { mode: "edit"; income: Income } | null

export function IncomeSection({ incomes, filters }: { incomes: Income[]; filters: EntriesFilters }) {
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
  const categoryById = useCategoriesStore((s) => s.byId)

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const visible = useMemo(() => {
    const term = filters.search.trim().toLowerCase()
    return incomes.filter(
      (i) =>
        (!term || i.name.toLowerCase().includes(term)) &&
        (!filters.pendingOnly || !i.received) &&
        (!filters.categoryId || i.categoryId === filters.categoryId)
    )
  }, [incomes, filters])

  // Manual drag-reorder only makes sense on the full, ungrouped list.
  const canReorder = !filters.search && !filters.pendingOnly && !filters.categoryId && !filters.groupBy
  const { order, draggingId, getItemProps, getHandleProps } = useReorder(visible, reorderIncomes)
  const rows = canReorder ? order : visible

  const groups = useMemo(() => {
    if (!filters.groupBy) return null
    const map = new Map<string, Income[]>()
    for (const i of visible) {
      const key = i.categoryId || "__none__"
      const list = map.get(key)
      if (list) list.push(i)
      else map.set(key, [i])
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

  function renderRow(income: Income, withHandle: boolean) {
    const hasMeta = Boolean(income.categoryId || income.accountId)
    return (
      <li
        key={income.id}
        {...(withHandle ? getItemProps(income.id) : {})}
        className={cn(
          "group relative flex flex-col gap-1 py-1.5 text-sm sm:flex-row sm:items-center sm:gap-3 sm:py-2 sm:pr-1",
          !income.active && "opacity-55",
          draggingId === income.id && "opacity-40"
        )}
      >
        <div className="flex min-w-0 items-center gap-2 sm:flex-1 sm:gap-3">
          {/* Fixed-width handle slot, reserved even when reordering is off
              (filtered/grouped), so rows never shift left between states. */}
          <div className="hidden w-4 shrink-0 sm:block">
            {withHandle && (
              <DragHandle
                {...getHandleProps(income.id)}
                className="opacity-0 group-hover:opacity-100"
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => handleToggleReceived(income.id)}
            aria-label={income.received ? "Marcar como não recebida" : "Marcar como recebida"}
            title={income.received ? "Recebida (desmarcar)" : "Marcar recebida"}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150 active:scale-90",
              income.received
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-muted-foreground/30 text-white hover:border-emerald-500"
            )}
          >
            <Check
              className={cn(
                "size-3 transition-all duration-200",
                income.received ? "scale-100 opacity-100" : "scale-0 opacity-0"
              )}
              strokeWidth={3}
            />
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
          <MoneyValue value={income.amount} className="shrink-0 font-semibold tabular-nums text-emerald-500" />
          <div className="flex shrink-0 items-center sm:hidden sm:group-hover:flex sm:focus-within:flex">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Ações da entrada" title="Ações">
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleToggle(income.id)}>
                  <Power className={cn("size-4", income.active ? "text-emerald-500" : "text-muted-foreground/50")} />
                  {income.active ? "Desativar" : "Ativar"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialogState({ mode: "edit", income })}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(income.id)} className="text-destructive">
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
          <span className="size-2.5 shrink-0 rounded-full bg-emerald-500" />
          <CardTitle className="truncate">Entradas do mês</CardTitle>
        </button>
        <div className="flex shrink-0 items-center gap-1">
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
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <ArrowDownLeft className="size-5" />
              </span>
              <p className="text-sm text-muted-foreground">Nenhuma entrada ainda.</p>
              <Button variant="outline" size="sm" onClick={() => setDialogState({ mode: "create" })}>
                <Plus className="size-4" />
                Adicionar entrada
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma entrada encontrada.</p>
          ) : groups ? (
            <div className="scrollbar-hide flex max-h-[20rem] flex-col gap-4 overflow-y-auto sm:max-h-[26rem]">
              {groups.map((g) => (
                <div key={g.id}>
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {g.name}
                    </span>
                    <MoneyValue
                      value={g.subtotal}
                      className="shrink-0 text-xs font-semibold tabular-nums text-emerald-500"
                    />
                  </div>
                  <ul className="divide-y">{g.items.map((i) => renderRow(i, false))}</ul>
                </div>
              ))}
            </div>
          ) : (
            <ul className="scrollbar-hide max-h-[20rem] divide-y overflow-y-auto sm:max-h-[26rem]">
              {rows.map((i) => renderRow(i, canReorder))}
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
