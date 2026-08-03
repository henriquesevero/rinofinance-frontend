import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2, MoreHorizontal, Palette, Pencil, Plus, Tag, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoneyValue } from "@/components/MoneyValue"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DragHandle } from "@/components/DragHandle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { useReorder } from "@/lib/useReorder"
import { monthLabel, useMonthStore } from "@/lib/monthStore"
import { useCardsStore } from "@/features/cards/store"
import { useDashboardStore } from "@/features/dashboard/store"
import { computeCategorySpending } from "@/features/dashboard/categorySpending"
import { CategoryIcon } from "./categoryIcons"
import { CategoryFormDialog } from "./components/CategoryFormDialog"
import { useCategoriesStore } from "./store"
import type { Category } from "./types"

type DialogState = { mode: "create" } | { mode: "edit"; category: Category } | null

const UNCATEGORIZED_ID = "__none__"

export function CategoriesPage() {
  const categories = useCategoriesStore((s) => s.categories)
  const isLoading = useCategoriesStore((s) => s.isLoading)
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories)
  const createCategory = useCategoriesStore((s) => s.createCategory)
  const updateCategory = useCategoriesStore((s) => s.updateCategory)
  const deleteCategory = useCategoriesStore((s) => s.deleteCategory)
  const reorderCategories = useCategoriesStore((s) => s.reorderCategories)

  // Usage is derived from the same month-scoped data the dashboard shows, so
  // the numbers agree across screens.
  const month = useMonthStore((s) => s.month)
  const cards = useCardsStore((s) => s.cards)
  const fetchCards = useCardsStore((s) => s.fetchCards)
  const summary = useDashboardStore((s) => s.summary)
  const fetchSummary = useDashboardStore((s) => s.fetchSummary)

  const [dialog, setDialog] = useState<DialogState>(null)
  const [toDelete, setToDelete] = useState<Category | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const renameRef = useRef<HTMLInputElement>(null)

  const { order, draggingId, getItemProps, getHandleProps } = useReorder(categories, reorderCategories)

  useEffect(() => {
    fetchCategories()
    fetchCards()
    fetchSummary()
  }, [fetchCategories, fetchCards, fetchSummary])

  const expenses = summary?.expenses ?? []
  const { slices, total } = useMemo(
    () => computeCategorySpending(cards, expenses, categories),
    [cards, expenses, categories]
  )

  // Per-category spend for the viewed month, plus the derived headline figures.
  const usageById = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of slices) map.set(s.id, s.total)
    return map
  }, [slices])
  const uncategorized = usageById.get(UNCATEGORIZED_ID) ?? 0
  const categorized = total - uncategorized
  const biggest = useMemo(() => slices.find((s) => s.id !== UNCATEGORIZED_ID) ?? null, [slices])

  async function handleDelete(category: Category) {
    try {
      await deleteCategory(category.id)
      toast.success("Categoria removida")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  function startRename(category: Category) {
    setRenamingId(category.id)
    setDraftName(category.name)
    requestAnimationFrame(() => renameRef.current?.select())
  }

  async function commitRename(category: Category) {
    const name = draftName.trim()
    setRenamingId(null)
    if (!name || name === category.name) return
    try {
      await updateCategory(category.id, { name, color: category.color, icon: category.icon ?? "" })
      toast.success("Categoria renomeada")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Como seu dinheiro se divide — organize e acompanhe cada categoria.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ValuesVisibilityToggle />
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => setDialog({ mode: "create" })}
            aria-label="Nova categoria"
            title="Nova categoria"
          >
            <Plus className="size-5" />
          </Button>
        </div>
      </div>

      {isLoading && categories.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Carregando...
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Tag className="size-6" />
          </span>
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria ainda. Crie a primeira para organizar seus gastos.
          </p>
          <Button variant="outline" size="sm" onClick={() => setDialog({ mode: "create" })}>
            <Plus className="size-4" />
            Nova categoria
          </Button>
        </div>
      ) : (
        <>
          {/* summary strip — this month at a glance */}
          <Card className="gap-0 overflow-hidden p-0">
            <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
              <Cell label="Categorias">
                <span className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{categories.length}</span>
              </Cell>
              <Cell label="Categorizado" sub={monthLabel(month)}>
                <MoneyValue
                  value={categorized}
                  className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl"
                />
              </Cell>
              <Cell label="Maior" sub={biggest?.name}>
                {biggest ? (
                  <MoneyValue value={biggest.total} className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl" />
                ) : (
                  <span className="text-xl font-bold text-muted-foreground sm:text-2xl">—</span>
                )}
              </Cell>
              <Cell label="Sem categoria" sub={uncategorized > 0 ? "a categorizar" : "tudo certo"}>
                {uncategorized > 0 ? (
                  <MoneyValue value={uncategorized} className="text-xl font-bold tracking-tight tabular-nums text-amber-500 sm:text-2xl" />
                ) : (
                  <span className="text-xl font-bold text-emerald-500 sm:text-2xl">✓</span>
                )}
              </Cell>
            </div>
          </Card>

          {/* category list with usage — internal scroll like Entradas & Saídas */}
          <Card className="flex flex-col gap-1 p-2 sm:p-3">
            <ul className="scrollbar-hide flex max-h-[24rem] flex-col overflow-y-auto sm:max-h-[30rem]">
              {order.map((category) => {
                const usage = usageById.get(category.id) ?? 0
                const share = total > 0 ? (usage / total) * 100 : 0
                const renaming = renamingId === category.id
                return (
                  <li
                    key={category.id}
                    {...getItemProps(category.id)}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50",
                      draggingId === category.id && "opacity-40"
                    )}
                  >
                    <DragHandle
                      {...getHandleProps(category.id)}
                      className="-ml-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                    />
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${category.color}22` }}
                    >
                      <CategoryIcon name={category.icon} className="size-4.5" style={{ color: category.color }} />
                    </span>

                    <div className="min-w-0 flex-1">
                      {renaming ? (
                        <input
                          ref={renameRef}
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onBlur={() => commitRename(category)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(category)
                            if (e.key === "Escape") setRenamingId(null)
                          }}
                          className="w-full max-w-56 rounded-md border bg-background px-2 py-0.5 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startRename(category)}
                          title="Toque para renomear"
                          className="max-w-full truncate text-sm font-medium"
                        >
                          {category.name}
                        </button>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                          {share > 0 && (
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.max(share, 3)}%`, backgroundColor: category.color }}
                            />
                          )}
                        </div>
                        <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                          {share >= 1 ? `${Math.round(share)}%` : usage > 0 ? "<1%" : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end">
                      {usage > 0 ? (
                        <MoneyValue value={usage} className="text-sm font-semibold tabular-nums" />
                      ) : (
                        <span className="text-xs text-muted-foreground">sem gastos</span>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100 [@media(hover:none)]:opacity-100"
                            aria-label="Ações da categoria"
                            title="Ações"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => startRename(category)}>
                          <Pencil className="size-4" />
                          Renomear
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDialog({ mode: "edit", category })}>
                          <Palette className="size-4" />
                          Cor e ícone
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setToDelete(category)} className="text-destructive">
                          <Trash2 className="size-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                )
              })}
            </ul>
          </Card>
        </>
      )}

      <CategoryFormDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        initial={
          dialog?.mode === "edit"
            ? { name: dialog.category.name, color: dialog.category.color, icon: dialog.category.icon ?? "" }
            : undefined
        }
        onSubmit={async (input) => {
          try {
            if (dialog?.mode === "edit") {
              await updateCategory(dialog.category.id, input)
              toast.success("Categoria atualizada")
            } else {
              await createCategory(input)
              toast.success("Categoria criada")
            }
          } catch (err) {
            toast.error(toErrorMessage(err))
            throw err
          }
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Remover categoria"
        description={
          toDelete ? (
            <>
              Remover a categoria <strong>{toDelete.name}</strong>? Os itens ligados a ela ficarão sem categoria.
            </>
          ) : null
        }
        confirmLabel="Remover"
        destructive
        onConfirm={() => {
          if (toDelete) return handleDelete(toDelete)
        }}
      />
    </div>
  )
}

function Cell({
  label,
  sub,
  children,
}: {
  label: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col justify-center gap-0.5 bg-card p-4 sm:gap-1 sm:p-5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
      {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}
