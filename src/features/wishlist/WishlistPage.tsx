import { useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  ShoppingCart,
  Tag,
  Trash2,
} from "lucide-react"
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
import { MoneyValue } from "@/components/MoneyValue"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { useReorder } from "@/lib/useReorder"
import { ItemCard } from "./components/ItemCard"
import { ItemFormDialog } from "./components/ItemFormDialog"
import { PriorityList } from "./components/PriorityList"
import { SectionFormDialog } from "./components/SectionFormDialog"
import { useBelongingsStore, useWishlistStore } from "./store"
import type { ItemInput, SectionInput, WishlistItem, WishlistSection } from "./types"

type ItemDialogState = { mode: "create"; sectionId?: string } | { mode: "edit"; item: WishlistItem } | null
type SectionDialogState = { mode: "create" } | { mode: "edit"; section: WishlistSection } | null

const NONE = "__none__"

export interface ItemDnd {
  active: boolean
  draggingId: string | null
  start: (id: string) => void
  end: () => void
  drop: (sectionId: string, beforeId: string | null) => void
}

type StoreHook = typeof useWishlistStore

export function WishlistPage() {
  return (
    <ListPage
      useStore={useWishlistStore}
      title="Lista de desejos"
      description="Os produtos que você quer comprar, organizados como uma loja."
      totalLabel="Total desejado"
      maxLabel="Mais caro"
      enablePriorityView
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
  enablePriorityView,
}: {
  useStore: StoreHook
  title: string
  description: string
  totalLabel: string
  maxLabel: string
  enablePriorityView?: boolean
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
  const moveItem = useStore((s) => s.moveItem)
  const reorderPriority = useStore((s) => s.reorderPriority)
  const reorderSections = useStore((s) => s.reorderSections)

  const [itemDialog, setItemDialog] = useState<ItemDialogState>(null)
  const [sectionDialog, setSectionDialog] = useState<SectionDialogState>(null)
  const [deletingItem, setDeletingItem] = useState<WishlistItem | null>(null)
  const [deletingSection, setDeletingSection] = useState<WishlistSection | null>(null)
  const [editing, setEditing] = useState(false)
  const [view, setView] = useState<"sections" | "priority">("sections")
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const draggingRef = useRef<string | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string>("")

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
  const sectionReorder = useReorder(sections, (ids) =>
    reorderSections(ids).catch((err) => toast.error(toErrorMessage(err)))
  )

  // Mobile shows one section at a time via tabs, so there's nothing to collapse.
  // `sectionReorder.order` lags one render behind `sections` right after data loads
  // (it syncs via its own effect), so fall back to `sections` until it catches up —
  // otherwise the tab list briefly only contains "Sem seção" and gets stuck selected.
  const sectionsForTabs = sectionReorder.order.length === sections.length ? sectionReorder.order : sections
  const mobileTabs = useMemo(() => {
    const list = sectionsForTabs.map((s) => ({ id: s.id, name: s.name, color: s.color as string | undefined }))
    if (ungrouped.length > 0) list.push({ id: NONE, name: "Sem seção", color: undefined })
    return list
  }, [sectionsForTabs, ungrouped.length])

  useEffect(() => {
    if (mobileTabs.length === 0) {
      if (activeSectionId !== "") setActiveSectionId("")
      return
    }
    if (!mobileTabs.some((t) => t.id === activeSectionId)) {
      setActiveSectionId(mobileTabs[0].id)
    }
  }, [mobileTabs, activeSectionId])

  const activeItems = activeSectionId === NONE ? ungrouped : itemsBySection.get(activeSectionId) ?? []
  const isRealActiveSection = activeSectionId !== "" && activeSectionId !== NONE
  const activeSectionOrderIndex = sectionReorder.order.findIndex((s) => s.id === activeSectionId)

  function handleMobileAddItem() {
    setItemDialog({ mode: "create", sectionId: isRealActiveSection ? activeSectionId : undefined })
  }

  function handleMobileEditSection() {
    const section = sections.find((s) => s.id === activeSectionId)
    if (section) setSectionDialog({ mode: "edit", section })
  }

  function handleMobileDeleteSection() {
    const section = sections.find((s) => s.id === activeSectionId)
    if (section) setDeletingSection(section)
  }

  function moveItemTo(dragId: string, targetSectionId: string, beforeId: string | null) {
    if (dragId === beforeId) return
    const source = items.find((i) => i.id === dragId)
    if (!source) return

    const order = [...sections.map((s) => s.id), NONE]
    const groups = new Map<string, WishlistItem[]>()
    for (const key of order) groups.set(key, [])
    for (const it of items) {
      const key = it.sectionId ?? NONE
      groups.set(key, [...(groups.get(key) ?? []), it])
    }
    for (const arr of groups.values()) {
      const idx = arr.findIndex((i) => i.id === dragId)
      if (idx >= 0) arr.splice(idx, 1)
    }

    const moved: WishlistItem = { ...source, sectionId: targetSectionId || undefined }
    const targetKey = targetSectionId || NONE
    const targetArr = groups.get(targetKey) ?? []
    if (beforeId) {
      const idx = targetArr.findIndex((i) => i.id === beforeId)
      targetArr.splice(idx < 0 ? targetArr.length : idx, 0, moved)
    } else {
      targetArr.push(moved)
    }
    groups.set(targetKey, targetArr)

    const seen = new Set(order)
    const newItems = order.flatMap((key) => groups.get(key) ?? [])
    for (const [key, arr] of groups) if (!seen.has(key)) newItems.push(...arr)

    const changedSection = (source.sectionId ?? "") !== (targetSectionId || "")
    moveItem(
      dragId,
      targetSectionId || "",
      newItems,
      newItems.map((i) => i.id),
      changedSection
    )
  }

  // Touch-friendly alternative to dragging an item, used by the mobile up/down
  // buttons — reorders within the same section list via the existing move logic.
  function moveItemBy(item: WishlistItem, sectionItems: WishlistItem[], delta: -1 | 1) {
    const i = sectionItems.findIndex((x) => x.id === item.id)
    if (i === -1) return
    const target = i + delta
    if (target < 0 || target >= sectionItems.length) return
    const beforeId = delta < 0 ? sectionItems[i - 1].id : (sectionItems[i + 2]?.id ?? null)
    moveItemTo(item.id, item.sectionId ?? "", beforeId)
  }

  const dnd: ItemDnd = {
    active: draggingId !== null,
    draggingId,
    start: (id) => {
      draggingRef.current = id
      setDraggingId(id)
    },
    end: () => {
      draggingRef.current = null
      setDraggingId(null)
    },
    drop: (sectionId, beforeId) => {
      const id = draggingRef.current
      draggingRef.current = null
      setDraggingId(null)
      if (id) moveItemTo(id, sectionId, beforeId)
    },
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
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="hidden text-muted-foreground sm:block">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ValuesVisibilityToggle />
          {!isEmpty && view === "sections" && (
            <Button
              variant={editing ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? <Check className="size-4" /> : <Pencil className="size-4" />}
              {editing ? "Concluído" : "Editar"}
            </Button>
          )}
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

      {enablePriorityView && !isEmpty && (
        <div className="inline-flex w-fit items-center gap-0.5 self-start rounded-lg border bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => setView("sections")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "sections" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-3.5" />
            Por seção
          </button>
          <button
            type="button"
            onClick={() => setView("priority")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "priority" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListOrdered className="size-3.5" />
            Prioridade de compra
          </button>
        </div>
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
      ) : enablePriorityView && view === "priority" ? (
        <PriorityList
          items={items}
          sections={sections}
          onReorder={(ids) => reorderPriority(ids).catch((err) => toast.error(toErrorMessage(err)))}
          onEdit={(item) => setItemDialog({ mode: "edit", item })}
          onDelete={(item) => setDeletingItem(item)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {mobileTabs.map((tab) => {
              const active = tab.id === activeSectionId
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSectionId(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-transparent bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.color && (
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: active ? "currentColor" : tab.color }}
                    />
                  )}
                  {tab.name}
                </button>
              )
            })}
          </div>

          {isRealActiveSection && editing && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => sectionReorder.moveBy(activeSectionId, -1)}
                disabled={activeSectionOrderIndex <= 0}
                aria-label="Mover seção para a esquerda"
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => sectionReorder.moveBy(activeSectionId, 1)}
                disabled={activeSectionOrderIndex < 0 || activeSectionOrderIndex >= sectionReorder.order.length - 1}
                aria-label="Mover seção para a direita"
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
              <Button variant="ghost" size="icon" className="size-7" aria-label="Editar seção" onClick={handleMobileEditSection}>
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" aria-label="Remover seção" onClick={handleMobileDeleteSection}>
                <Trash2 className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="ml-auto size-7" aria-label="Adicionar item" onClick={handleMobileAddItem}>
                <Plus className="size-4" />
              </Button>
            </div>
          )}

          <div className="flex min-h-[52vh] flex-col justify-center">
            <Card className="p-4">
              {activeItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhum item nesta seção.</p>
              ) : (
                <ItemGrid
                  items={activeItems}
                  sectionId={isRealActiveSection ? activeSectionId : ""}
                  editing={editing}
                  dnd={dnd}
                  onEdit={(item) => setItemDialog({ mode: "edit", item })}
                  onDelete={(item) => setDeletingItem(item)}
                  onMove={(item, delta) => moveItemBy(item, activeItems, delta)}
                />
              )}
            </Card>
          </div>
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
        initialColor={sectionDialog?.mode === "edit" ? sectionDialog.section.color : undefined}
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

function ItemGrid({
  items,
  sectionId,
  editing,
  dnd,
  onEdit,
  onDelete,
  onMove,
}: {
  items: WishlistItem[]
  sectionId: string
  editing: boolean
  dnd: ItemDnd
  onEdit: (item: WishlistItem) => void
  onDelete: (item: WishlistItem) => void
  onMove: (item: WishlistItem, delta: -1 | 1) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item, index) => (
        <ItemCard
          key={item.id}
          item={item}
          sectionId={sectionId}
          editing={editing}
          dnd={dnd}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
          onMoveUp={index > 0 ? () => onMove(item, -1) : undefined}
          onMoveDown={index < items.length - 1 ? () => onMove(item, 1) : undefined}
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
