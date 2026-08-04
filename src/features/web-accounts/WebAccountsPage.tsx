import { useEffect, useMemo, useState } from "react"
import { Check, ChevronDown, Globe, Loader2, Pencil, Plus, Tag, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DragHandle } from "@/components/DragHandle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { useReorder } from "@/lib/useReorder"
import { SectionFormDialog } from "@/features/wishlist/components/SectionFormDialog"
import type { ItemInput, SectionInput, WishlistItem, WishlistSection } from "@/features/wishlist/types"
import { AccountFormDialog } from "./components/AccountFormDialog"
import { SiteLogo } from "./components/SiteLogo"
import { useWebAccountsStore } from "./store"

type AccountDialogState = { mode: "create"; sectionId?: string } | { mode: "edit"; account: WishlistItem } | null
type SectionDialogState = { mode: "create" } | { mode: "edit"; section: WishlistSection } | null

const NONE = "__none__"

export function WebAccountsPage() {
  const sections = useWebAccountsStore((s) => s.sections)
  const items = useWebAccountsStore((s) => s.items)
  const isLoading = useWebAccountsStore((s) => s.isLoading)
  const error = useWebAccountsStore((s) => s.error)
  const fetchWishlist = useWebAccountsStore((s) => s.fetchWishlist)
  const createSection = useWebAccountsStore((s) => s.createSection)
  const updateSection = useWebAccountsStore((s) => s.updateSection)
  const deleteSection = useWebAccountsStore((s) => s.deleteSection)
  const createItem = useWebAccountsStore((s) => s.createItem)
  const updateItem = useWebAccountsStore((s) => s.updateItem)
  const deleteItem = useWebAccountsStore((s) => s.deleteItem)
  const reorderItems = useWebAccountsStore((s) => s.reorderItems)

  const [accountDialog, setAccountDialog] = useState<AccountDialogState>(null)
  const [sectionDialog, setSectionDialog] = useState<SectionDialogState>(null)
  const [deletingAccount, setDeletingAccount] = useState<WishlistItem | null>(null)
  const [deletingSection, setDeletingSection] = useState<WishlistSection | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  const itemsBySection = useMemo(() => {
    const map = new Map<string, WishlistItem[]>()
    for (const item of items) {
      const key = item.sectionId ?? NONE
      map.set(key, [...(map.get(key) ?? []), item])
    }
    return map
  }, [items])

  const ungrouped = itemsBySection.get(NONE) ?? []

  function persistOrder(sectionOrderedIds: string[]) {
    const set = new Set(sectionOrderedIds)
    const queue = [...sectionOrderedIds]
    const fullIds = items.map((i) => (set.has(i.id) ? (queue.shift() as string) : i.id))
    reorderItems(fullIds).catch((err) => toast.error(toErrorMessage(err)))
  }

  async function handleDeleteAccount() {
    if (!deletingAccount) return
    try {
      await deleteItem(deletingAccount.id)
      toast.success("Conta removida")
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

  async function handleAccountSubmit(input: ItemInput) {
    try {
      if (accountDialog?.mode === "edit") {
        await updateItem(accountDialog.account.id, input)
        toast.success("Conta atualizada")
      } else {
        await createItem(input)
        toast.success("Conta adicionada")
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
          <h1 className="text-2xl font-bold tracking-tight">Contas na Internet</h1>
          <p className="text-muted-foreground">Seus acessos, com o logo de cada site. Toque para abrir o login.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!isEmpty && (
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
              <DropdownMenuItem onClick={() => setAccountDialog({ mode: "create" })}>
                <Globe className="size-4" />
                Nova conta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSectionDialog({ mode: "create" })}>
                <Tag className="size-4" />
                Nova seção
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Globe className="size-6" />
          </span>
          <p className="text-sm text-muted-foreground">
            Nenhuma conta ainda. Adicione um site com o endereço de login (ex.: Magazine Luiza, Google…).
          </p>
          <Button variant="outline" size="sm" onClick={() => setAccountDialog({ mode: "create" })}>
            <Plus className="size-4" />
            Adicionar conta
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <Section
              key={section.id}
              title={section.name}
              color={section.color}
              count={(itemsBySection.get(section.id) ?? []).length}
              editing={editing}
              onAdd={() => setAccountDialog({ mode: "create", sectionId: section.id })}
              onEdit={() => setSectionDialog({ mode: "edit", section })}
              onDelete={() => setDeletingSection(section)}
            >
              <AccountGrid
                accounts={itemsBySection.get(section.id) ?? []}
                editing={editing}
                onReorder={persistOrder}
                onEdit={(account) => setAccountDialog({ mode: "edit", account })}
                onDelete={(account) => setDeletingAccount(account)}
              />
            </Section>
          ))}

          {ungrouped.length > 0 && (
            <Section
              title="Sem seção"
              count={ungrouped.length}
              editing={editing}
              onAdd={() => setAccountDialog({ mode: "create" })}
            >
              <AccountGrid
                accounts={ungrouped}
                editing={editing}
                onReorder={persistOrder}
                onEdit={(account) => setAccountDialog({ mode: "edit", account })}
                onDelete={(account) => setDeletingAccount(account)}
              />
            </Section>
          )}
        </div>
      )}

      <AccountFormDialog
        open={accountDialog !== null}
        onOpenChange={(open) => !open && setAccountDialog(null)}
        account={accountDialog?.mode === "edit" ? accountDialog.account : undefined}
        sections={sections}
        defaultSectionId={accountDialog?.mode === "create" ? accountDialog.sectionId : undefined}
        onSubmit={handleAccountSubmit}
      />

      <SectionFormDialog
        open={sectionDialog !== null}
        onOpenChange={(open) => !open && setSectionDialog(null)}
        initialName={sectionDialog?.mode === "edit" ? sectionDialog.section.name : undefined}
        initialColor={sectionDialog?.mode === "edit" ? sectionDialog.section.color : undefined}
        onSubmit={handleSectionSubmit}
      />

      <ConfirmDialog
        open={deletingAccount !== null}
        onOpenChange={(open) => !open && setDeletingAccount(null)}
        title="Remover conta"
        description={
          deletingAccount ? (
            <>
              Remover <strong>{deletingAccount.name}</strong> das suas contas?
            </>
          ) : null
        }
        confirmLabel="Remover"
        destructive
        onConfirm={handleDeleteAccount}
      />

      <ConfirmDialog
        open={deletingSection !== null}
        onOpenChange={(open) => !open && setDeletingSection(null)}
        title="Remover seção"
        description={
          deletingSection ? (
            <>
              Remover a seção <strong>{deletingSection.name}</strong>? As contas dela ficam sem seção (não são
              apagadas).
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
  color,
  count,
  editing,
  onAdd,
  onEdit,
  onDelete,
  children,
}: {
  title: string
  color?: string
  count: number
  editing: boolean
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
          <h2
            className={cn("truncate text-sm font-semibold tracking-wide", !color && "text-muted-foreground")}
            style={color ? { color } : undefined}
          >
            {title}
          </h2>
          <span className="shrink-0 text-xs text-muted-foreground">({count})</span>
        </button>
        {editing && (
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
            <Button variant="ghost" size="icon" className="size-7" aria-label="Adicionar conta" onClick={onAdd}>
              <Plus className="size-4" />
            </Button>
          </div>
        )}
      </div>
      {!collapsed &&
        (count === 0 ? <p className="text-sm text-muted-foreground">Nenhuma conta nesta seção.</p> : children)}
    </section>
  )
}

function AccountGrid({
  accounts,
  editing,
  onReorder,
  onEdit,
  onDelete,
}: {
  accounts: WishlistItem[]
  editing: boolean
  onReorder: (orderedIds: string[]) => void
  onEdit: (account: WishlistItem) => void
  onDelete: (account: WishlistItem) => void
}) {
  const { order, draggingId, getItemProps, getHandleProps } = useReorder(accounts, onReorder)
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {order.map((account) => (
        <AccountTile
          key={account.id}
          account={account}
          editing={editing}
          onEdit={() => onEdit(account)}
          onDelete={() => onDelete(account)}
          reorderProps={editing ? getItemProps(account.id) : undefined}
          dragging={draggingId === account.id}
          dragHandle={
            editing ? (
              <DragHandle {...getHandleProps(account.id)} className="text-muted-foreground/70 hover:text-foreground" />
            ) : undefined
          }
        />
      ))}
    </div>
  )
}

function AccountTile({
  account,
  editing,
  onEdit,
  onDelete,
  reorderProps,
  dragHandle,
  dragging,
}: {
  account: WishlistItem
  editing: boolean
  onEdit: () => void
  onDelete: () => void
  reorderProps?: React.HTMLAttributes<HTMLDivElement>
  dragHandle?: React.ReactNode
  dragging?: boolean
}) {
  const href = account.url ? (account.url.includes("://") ? account.url : `https://${account.url}`) : undefined

  const content = (
    <div className="flex aspect-square items-center justify-center p-1.5">
      <SiteLogo name={account.name} url={account.url} imageUrl={account.imageUrl} className="max-h-full" />
    </div>
  )

  return (
    <div
      {...reorderProps}
      className={cn(
        "relative w-[80%] justify-self-center transition-transform duration-300 ease-out",
        !editing && "hover:scale-[1.06]",
        dragging && "opacity-40"
      )}
    >
      {editing && dragHandle && (
        <div className="absolute left-0 top-0 z-10 flex items-center justify-center rounded-md bg-background/80 p-0.5 shadow-sm backdrop-blur">
          {dragHandle}
        </div>
      )}

      {editing && (
        <button
          type="button"
          aria-label={`Remover ${account.name}`}
          onClick={onDelete}
          className="absolute right-0 top-0 z-10 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow-sm transition hover:brightness-110"
        >
          <X className="size-3.5" strokeWidth={3} />
        </button>
      )}

      {editing ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar ${account.name}`}
          className="block w-full cursor-pointer outline-none"
        >
          {content}
        </button>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block outline-none"
          aria-label={`Abrir ${account.name}`}
        >
          {content}
        </a>
      )}
    </div>
  )
}
