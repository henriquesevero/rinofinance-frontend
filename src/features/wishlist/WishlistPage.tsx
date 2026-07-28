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
import { MoneyValue } from "@/components/MoneyValue"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
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
    />
  )
}

export function BelongingsPage() {
  return (
    <ListPage
      useStore={useBelongingsStore}
      title="Itens que possuo"
      description="Tudo que você tem em seu patrimônio."
    />
  )
}

function ListPage({ useStore, title, description }: { useStore: StoreHook; title: string; description: string }) {
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

  const [itemDialog, setItemDialog] = useState<ItemDialogState>(null)
  const [sectionDialog, setSectionDialog] = useState<SectionDialogState>(null)
  const [deletingItem, setDeletingItem] = useState<WishlistItem | null>(null)
  const [deletingSection, setDeletingSection] = useState<WishlistSection | null>(null)

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  // Items grouped by section id (with a NONE bucket for the ungrouped ones).
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

      {/* total dos itens — compacto e discreto */}
      <Card className="flex w-full flex-col gap-1 p-4 sm:max-w-[14rem]">
        <div className="flex items-center gap-1.5">
          <ShoppingCart className="size-3.5 text-muted-foreground" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Total dos itens
          </h2>
        </div>
        <MoneyValue value={total} className="text-xl font-bold tracking-tight tabular-nums" />
      </Card>

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
                onAdd={() => setItemDialog({ mode: "create", sectionId: section.id })}
                onEdit={() => setSectionDialog({ mode: "edit", section })}
                onDelete={() => setDeletingSection(section)}
              >
                {sectionItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onEdit={() => setItemDialog({ mode: "edit", item })}
                    onDelete={() => setDeletingItem(item)}
                  />
                ))}
              </Section>
            )
          })}

          {ungrouped.length > 0 && (
            <Section
              title="Sem seção"
              count={ungrouped.length}
              onAdd={() => setItemDialog({ mode: "create" })}
            >
              {ungrouped.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => setItemDialog({ mode: "edit", item })}
                  onDelete={() => setDeletingItem(item)}
                />
              ))}
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

// A titled section (Eletrônicos, Roupas, ...) with an item grid. Real
// sections get edit/delete; the "Sem seção" bucket only gets an add button.
function Section({
  title,
  count,
  onAdd,
  onEdit,
  onDelete,
  children,
}: {
  title: string
  count: number
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
          <span className="shrink-0 text-xs text-muted-foreground">({count})</span>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{children}</div>
        ))}
    </section>
  )
}
