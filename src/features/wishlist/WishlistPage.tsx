import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Loader2, Pencil, Plus, ShoppingCart, Tag, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DragHandle } from "@/components/DragHandle"
import { MoneyValue } from "@/components/MoneyValue"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { useReorder } from "@/lib/useReorder"
import { ItemCard } from "./components/ItemCard"
import { ItemFormDialog } from "./components/ItemFormDialog"
import { SectionFormDialog } from "./components/SectionFormDialog"
import { useBelongingsStore, useWishlistStore } from "./store"
import type { ItemInput, SectionInput, WishlistItem, WishlistSection } from "./types"

type ItemDialogState = { mode: "create"; sectionId?: string } | { mode: "edit"; item: WishlistItem } | null
type SectionDialogState = { mode: "create" } | { mode: "edit"; section: WishlistSection } | null

const NONE = "__none__"

type StoreHook = typeof useWishlistStore

export function WishlistPage() {
  return (
    <ListPage
      useStore={useWishlistStore}
      title="Lista de desejos"
      description="Os produtos que você quer comprar, organizados como uma loja."
      totalLabel="Total desejado"
      maxLabel="Mais caro"
    />
  )
}

export function BelongingsPage() {
  return (
    <ListPage
      useStore={useBelongingsStore}
      title="Itens que possuo"
      description="Tudo que você tem em seu patrimônio."
      totalLabel="Valor total"
      maxLabel="Mais valioso"
    />
  )
}

function ListPage({
  useStore,
  title,
  description,
  totalLabel,
  maxLabel,
}: {
  useStore: StoreHook
  title: string
  description: string
  totalLabel: string
  maxLabel: string
}) {
  const sections = useStore((s) => s.sections)
  const items = useStore((s) => s.items)
  const total = useStore((s) => s.total)
  const isLoading = useStore((s) => s.isLoading)
  const error = useStore((s) => s.error)
  const fetchWishlist = useStore((s) => s.fetchWishlist)
  const createSection = useStore((s) => s.createSection)
  const updateSection = useStore((s) => s.updateSection)
  const deleteSection = useStore((s) => s.deleteSection)
  const createItem = useStore((s) => s.createItem)
  const updateItem = useStore((s) => s.updateItem)
  const deleteItem = useStore((s) => s.deleteItem)
  const reorderItems = useStore((s) => s.reorderItems)

  const [itemDialog, setItemDialog] = useState<ItemDialogState>(null)
  const [sectionDialog, setSectionDialog] = useState<SectionDialogState>(null)
  const [deletingItem, setDeletingItem] = useState<WishlistItem | null>(null)
  const [deletingSection, setDeletingSection] = useState<WishlistSection | null>(null)

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  const itemsBySection = useMemo(() => {
    const map = new Map<string, WishlistItem[]>()
    for (const item of items) {
      const key = item.sectionId ?? NONE
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return map
  }, [items])

  const ungrouped = itemsBySection.get(NONE) ?? []
  const mostExpensive = useMemo(
    () => items.reduce<WishlistItem | null>((max, i) => (i.price > (max?.price ?? -1) ? i : max), null),
    [items]
  )
  const sectionTotal = (list: WishlistItem[]) => list.reduce((sum, i) => sum + i.price, 0)

  function persistItemOrder(sectionOrderedIds: string[]) {
    const set = new Set(sectionOrderedIds)
    const queue = [...sectionOrderedIds]
    const fullIds = items.map((i) => (set.has(i.id) ? (queue.shift() as string) : i.id))
    reorderItems(fullIds).catch((err) => toast.error(toErrorMessage(err)))
  }

  async function handleDeleteItem() {
    if (!deletingItem) return
    try {
      await deleteItem(deletingItem.id)
      toast.success("Item removido")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleDeleteSection() {
    if (!deletingSection) return
    try {
      await deleteSection(deletingSection.id)
      toast.success("Seção removida")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleItemSubmit(input: ItemInput) {
    try {
      if (itemDialog?.mode === "edit") {
        await updateItem(itemDialog.item.id, input)
        toast.success("Item atualizado")
      } else {
        await createItem(input)
        toast.success("Item adicionado")
      }
    } catch (err) {
      toast.error(toErrorMessage(err))
      throw err
    }
  }

  async function handleSectionSubmit(input: SectionInput) {
    try {
      if (sectionDialog?.mode === "edit") {
        await updateSection(sectionDialog.section.id, input)
        toast.success("Seção atualizada")
      } else {
        await createSection(input)
        toast.success("Seção criada")
      }
    } catch (err) {
      toast.error(toErrorMessage(err))
      throw err
    }
  }

  if (isLoading && items.length === 0 && sections.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (error && items.length === 0 && sections.length === 0) {
    return <p className="text-center text-destructive">{error}</p>
  }

  const isEmpty = items.length === 0 && sections.length === 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ValuesVisibilityToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-9" aria-label="Adicionar" title="Adicionar">
                  <Plus className="size-5" />
                </Button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setItemDialog({ mode: "create" })}>
                <ShoppingCart className="size-4" />
                Novo item
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSectionDialog({ mode: "create" })}>
                <Tag className="size-4" />
                Nova seção
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {!isEmpty && (
        <Card className="gap-0 overflow-hidden p-0">
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
            <Cell label={totalLabel} className="col-span-2 sm:col-span-1">
              <MoneyValue value={total} className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl" />
            </Cell>
            <Cell label="Itens">
              <span className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{items.length}</span>
            </Cell>
            <Cell label={maxLabel}>
              {mostExpensive ? (
                <MoneyValue value={mostExpensive.price} className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl" />
              ) : (
                <span className="text-xl font-bold text-muted-foreground sm:text-2xl">—</span>
              )}
            </Cell>
          </div>
        </Card>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShoppingCart className="size-6" />
          </span>
          <p className="text-sm text-muted-foreground">Nenhum item ainda. Adicione um produto que você quer comprar.</p>
          <Button variant="outline" size="sm" onClick={() => setItemDialog({ mode: "create" })}>
            <Plus className="size-4" />
            Adicionar item
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {sections.map((section) => {
            const sectionItems = itemsBySection.get(section.id) ?? []
            return (
              <Section
                key={section.id}
                title={section.name}
                count={sectionItems.length}
                total={sectionTotal(sectionItems)}
                onAdd={() => setItemDialog({ mode: "create", sectionId: section.id })}
                onEdit={() => setSectionDialog({ mode: "edit", section })}
                onDelete={() => setDeletingSection(section)}
              >
                <ReorderableItemGrid
                  items={sectionItems}
                  onReorder={persistItemOrder}
                  onEdit={(item) => setItemDialog({ mode: "edit", item })}
                  onDelete={(item) => setDeletingItem(item)}
                />
              </Section>
            )
          })}

          {ungrouped.length > 0 && (
            <Section
              title="Sem seção"
              count={ungrouped.length}
              total={sectionTotal(ungrouped)}
              onAdd={() => setItemDialog({ mode: "create" })}
            >
              <ReorderableItemGrid
                items={ungrouped}
                onReorder={persistItemOrder}
                onEdit={(item) => setItemDialog({ mode: "edit", item })}
                onDelete={(item) => setDeletingItem(item)}
              />
            </Section>
          )}
        </div>
      )}

      <ItemFormDialog
        open={itemDialog !== null}
        onOpenChange={(open) => !open && setItemDialog(null)}
        item={itemDialog?.mode === "edit" ? itemDialog.item : undefined}
        sections={sections}
        defaultSectionId={itemDialog?.mode === "create" ? itemDialog.sectionId : undefined}
        onSubmit={handleItemSubmit}
      />

      <SectionFormDialog
        open={sectionDialog !== null}
        onOpenChange={(open) => !open && setSectionDialog(null)}
        initialName={sectionDialog?.mode === "edit" ? sectionDialog.section.name : undefined}
        onSubmit={handleSectionSubmit}
      />

      <ConfirmDialog
        open={deletingItem !== null}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title="Remover item"
        description={
          deletingItem ? (
            <>
              Remover <strong>{deletingItem.name}</strong> da sua lista?
            </>
          ) : null
        }
        confirmLabel="Remover"
        destructive
        onConfirm={handleDeleteItem}
      />

      <ConfirmDialog
        open={deletingSection !== null}
        onOpenChange={(open) => !open && setDeletingSection(null)}
        title="Remover seção"
        description={
          deletingSection ? (
            <>
              Remover a seção <strong>{deletingSection.name}</strong>? Os itens dela ficam sem seção (não são
              apagados).
            </>
          ) : null
        }
        confirmLabel="Remover"
        destructive
        onConfirm={handleDeleteSection}
      />
    </div>
  )
}

function Section({
  title,
  count,
  total,
  onAdd,
  onEdit,
  onDelete,
  children,
}: {
  title: string
  count: number
  total: number
  onAdd: () => void
  onEdit?: () => void
  onDelete?: () => void
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex min-w-0 items-center gap-1.5 text-left"
        >
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", collapsed && "-rotate-90")}
          />
          <h2 className="truncate text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
          <span className="shrink-0 text-xs text-muted-foreground">
            ({count})
            {count > 0 && (
              <>
                {" · "}
                <MoneyValue value={total} className="font-medium tabular-nums text-foreground/70" />
              </>
            )}
          </span>
        </button>
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {onEdit && (
            <Button variant="ghost" size="icon" className="size-7" aria-label="Editar seção" onClick={onEdit}>
              <Pencil className="size-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="size-7" aria-label="Remover seção" onClick={onDelete}>
              <Trash2 className="size-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="size-7" aria-label="Adicionar item" onClick={onAdd}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
      {!collapsed &&
        (count === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum item nesta seção.</p>
        ) : (
          children
        ))}
    </section>
  )
}

function ReorderableItemGrid({
  items,
  onReorder,
  onEdit,
  onDelete,
}: {
  items: WishlistItem[]
  onReorder: (orderedIds: string[]) => void
  onEdit: (item: WishlistItem) => void
  onDelete: (item: WishlistItem) => void
}) {
  const { order, draggingId, getItemProps, getHandleProps } = useReorder(items, onReorder)
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {order.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
          reorderProps={getItemProps(item.id)}
          dragging={draggingId === item.id}
          dragHandle={<DragHandle {...getHandleProps(item.id)} className="text-white/80 hover:text-white" />}
        />
      ))}
    </div>
  )
}

function Cell({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col justify-center gap-0.5 bg-card p-4 sm:gap-1 sm:p-5", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
