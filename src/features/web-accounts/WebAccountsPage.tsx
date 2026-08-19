import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, ChevronUp, Globe, Loader2, Pencil, Plus, Tag, Trash2, X } from "lucide-react"
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
const NEUTRAL = "#9CA3AF"

interface AccountDnd {
  active: boolean
  draggingId: string | null
  start: (id: string) => void
  end: () => void
  drop: (sectionId: string, beforeId: string | null) => void
}

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
  const moveItem = useWebAccountsStore((s) => s.moveItem)
  const reorderSections = useWebAccountsStore((s) => s.reorderSections)

  const [accountDialog, setAccountDialog] = useState<AccountDialogState>(null)
  const [sectionDialog, setSectionDialog] = useState<SectionDialogState>(null)
  const [deletingAccount, setDeletingAccount] = useState<WishlistItem | null>(null)
  const [deletingSection, setDeletingSection] = useState<WishlistSection | null>(null)
  const [editing, setEditing] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const draggingRef = useRef<string | null>(null)

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
  const sectionReorder = useReorder(sections, (ids) =>
    reorderSections(ids).catch((err) => toast.error(toErrorMessage(err)))
  )

  function moveAccount(dragId: string, targetSectionId: string, beforeId: string | null) {
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

  // Touch-friendly alternative to dragging an account, used by the mobile up/down
  // buttons — reorders within the same section list via the existing move logic.
  function moveAccountBy(account: WishlistItem, sectionItems: WishlistItem[], delta: -1 | 1) {
    const i = sectionItems.findIndex((x) => x.id === account.id)
    if (i === -1) return
    const target = i + delta
    if (target < 0 || target >= sectionItems.length) return
    const beforeId = delta < 0 ? sectionItems[i - 1].id : (sectionItems[i + 2]?.id ?? null)
    moveAccount(account.id, account.sectionId ?? "", beforeId)
  }

  const dnd: AccountDnd = {
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
      if (id) moveAccount(id, sectionId, beforeId)
    },
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
          <h1 className="text-3xl font-extrabold tracking-tight">Contas na Internet</h1>
          <p className="hidden text-muted-foreground sm:block">Seus acessos, com o logo de cada site. Toque para abrir o login.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!isEmpty && (
            <Button variant={editing ? "default" : "outline"} size="sm" className="h-9" onClick={() => setEditing((e) => !e)}>
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

      {editing && (
        <p className="-mt-2 text-xs text-muted-foreground">
          <span className="hidden md:inline">Arraste uma conta para reordenar ou soltá-la em outra seção.</span>
          <span className="md:hidden">Use as setas para reordenar contas e seções.</span>
        </p>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
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
        <div className="gap-4 [column-fill:balance] sm:columns-2 xl:columns-3">
          {sectionReorder.order.map((section, sectionIndex) => (
            <SectionCard
              key={section.id}
              sectionId={section.id}
              title={section.name}
              color={section.color || NEUTRAL}
              count={(itemsBySection.get(section.id) ?? []).length}
              editing={editing}
              dnd={dnd}
              reorderProps={editing ? sectionReorder.getItemProps(section.id) : undefined}
              dragging={sectionReorder.draggingId === section.id}
              dragHandle={
                editing ? (
                  <DragHandle
                    {...sectionReorder.getHandleProps(section.id)}
                    className="text-muted-foreground/60 hover:text-foreground"
                  />
                ) : undefined
              }
              onMoveUp={sectionIndex > 0 ? () => sectionReorder.moveBy(section.id, -1) : undefined}
              onMoveDown={
                sectionIndex < sectionReorder.order.length - 1 ? () => sectionReorder.moveBy(section.id, 1) : undefined
              }
              onAdd={() => setAccountDialog({ mode: "create", sectionId: section.id })}
              onEdit={() => setSectionDialog({ mode: "edit", section })}
              onDelete={() => setDeletingSection(section)}
            >
              <AccountGrid
                accounts={itemsBySection.get(section.id) ?? []}
                sectionId={section.id}
                editing={editing}
                dnd={dnd}
                onEdit={(account) => setAccountDialog({ mode: "edit", account })}
                onDelete={(account) => setDeletingAccount(account)}
                onMove={(account, delta) => moveAccountBy(account, itemsBySection.get(section.id) ?? [], delta)}
              />
            </SectionCard>
          ))}

          {ungrouped.length > 0 && (
            <SectionCard
              sectionId=""
              title="Sem seção"
              color={NEUTRAL}
              count={ungrouped.length}
              editing={editing}
              dnd={dnd}
              onAdd={() => setAccountDialog({ mode: "create" })}
            >
              <AccountGrid
                accounts={ungrouped}
                sectionId=""
                editing={editing}
                dnd={dnd}
                onEdit={(account) => setAccountDialog({ mode: "edit", account })}
                onDelete={(account) => setDeletingAccount(account)}
                onMove={(account, delta) => moveAccountBy(account, ungrouped, delta)}
              />
            </SectionCard>
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
              Remover a seção <strong>{deletingSection.name}</strong>? As contas dela ficam sem seção (não são apagadas).
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

function SectionCard({
  sectionId,
  title,
  color,
  count,
  editing,
  dnd,
  reorderProps,
  dragHandle,
  dragging,
  onMoveUp,
  onMoveDown,
  onAdd,
  onEdit,
  onDelete,
  children,
}: {
  sectionId: string
  title: string
  color: string
  count: number
  editing: boolean
  dnd: AccountDnd
  reorderProps?: React.HTMLAttributes<HTMLElement>
  dragHandle?: React.ReactNode
  dragging?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  onAdd: () => void
  onEdit?: () => void
  onDelete?: () => void
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [dropActive, setDropActive] = useState(false)
  const canDrop = editing && dnd.active

  return (
    <section
      {...reorderProps}
      className={cn(
        "mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm",
        dragging && "opacity-40"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        {editing && dragHandle}
        {editing && (onMoveUp || onMoveDown) && (
          <div className="flex shrink-0 items-center gap-0.5 md:hidden">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!onMoveUp}
              aria-label="Mover seção para cima"
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!onMoveDown}
              aria-label="Mover seção para baixo"
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
        )}
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          <h2 className="min-w-0 truncate text-sm font-semibold tracking-tight" style={{ color }}>
            {title}
          </h2>
          <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">{count}</span>
          <ChevronDown
            className={cn("size-3.5 shrink-0 text-muted-foreground/50 transition-transform", collapsed && "-rotate-90")}
          />
        </button>
        {editing && (
          <div className="flex shrink-0 items-center gap-0.5">
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

      {!collapsed && (
        <div
          onDragOver={canDrop ? (e) => e.preventDefault() : undefined}
          onDragEnter={canDrop ? () => setDropActive(true) : undefined}
          onDragLeave={canDrop ? (e) => e.currentTarget.contains(e.relatedTarget as Node) || setDropActive(false) : undefined}
          onDrop={
            canDrop
              ? (e) => {
                  e.preventDefault()
                  setDropActive(false)
                  dnd.drop(sectionId, null)
                }
              : undefined
          }
          className={cn("border-t border-border/50 p-3 transition-colors", dropActive && "bg-primary/5")}
        >
          {count === 0 ? (
            <p className={cn("py-2 text-center text-xs text-muted-foreground", canDrop && "rounded-lg border border-dashed")}>
              {canDrop ? "Solte uma conta aqui" : "Nenhuma conta nesta seção."}
            </p>
          ) : (
            children
          )}
        </div>
      )}
    </section>
  )
}

function AccountGrid({
  accounts,
  sectionId,
  editing,
  dnd,
  onEdit,
  onDelete,
  onMove,
}: {
  accounts: WishlistItem[]
  sectionId: string
  editing: boolean
  dnd: AccountDnd
  onEdit: (account: WishlistItem) => void
  onDelete: (account: WishlistItem) => void
  onMove: (account: WishlistItem, delta: -1 | 1) => void
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-x-2 gap-y-3">
      {accounts.map((account, index) => (
        <AccountTile
          key={account.id}
          account={account}
          sectionId={sectionId}
          editing={editing}
          dnd={dnd}
          onEdit={() => onEdit(account)}
          onDelete={() => onDelete(account)}
          onMoveUp={index > 0 ? () => onMove(account, -1) : undefined}
          onMoveDown={index < accounts.length - 1 ? () => onMove(account, 1) : undefined}
        />
      ))}
    </div>
  )
}

function AccountTile({
  account,
  sectionId,
  editing,
  dnd,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  account: WishlistItem
  sectionId: string
  editing: boolean
  dnd: AccountDnd
  onEdit: () => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  const href = account.url ? (account.url.includes("://") ? account.url : `https://${account.url}`) : undefined
  const dragging = dnd.draggingId === account.id
  const [over, setOver] = useState(false)
  const isTarget = over && dnd.active && !dragging

  const content = (
    <div className="flex flex-col items-center gap-1">
      <div className="aspect-square w-full">
        <SiteLogo
          name={account.name}
          url={account.url}
          logoUrl={account.logoUrl}
          imageUrl={account.imageUrl}
          className={cn(
            "size-full transition-shadow duration-300",
            !editing && "group-hover:shadow-[0_16px_40px_-14px_rgba(97,218,251,0.65)]"
          )}
        />
      </div>
      <p className="w-full truncate text-center text-[11px] leading-tight text-muted-foreground">{account.name}</p>
    </div>
  )

  return (
    <div
      title={account.name}
      draggable={editing}
      onDragStart={
        editing
          ? (e) => {
              e.dataTransfer.effectAllowed = "move"
              dnd.start(account.id)
            }
          : undefined
      }
      onDragEnd={
        editing
          ? () => {
              setOver(false)
              dnd.end()
            }
          : undefined
      }
      onDragOver={editing && dnd.active ? (e) => e.preventDefault() : undefined}
      onDragEnter={editing && dnd.active && !dragging ? () => setOver(true) : undefined}
      onDragLeave={
        editing && dnd.active
          ? (e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false)
            }
          : undefined
      }
      onDrop={
        editing && dnd.active
          ? (e) => {
              e.preventDefault()
              e.stopPropagation()
              setOver(false)
              dnd.drop(sectionId, account.id)
            }
          : undefined
      }
      className={cn(
        "group relative rounded-xl transition-all duration-200 ease-out",
        editing && "cursor-grab active:cursor-grabbing",
        !editing && "hover:scale-[1.08]",
        isTarget && "scale-95 bg-primary/15 ring-2 ring-primary/60",
        dragging && "opacity-40"
      )}
    >
      {editing && (
        <button
          type="button"
          aria-label={`Remover ${account.name}`}
          onClick={onDelete}
          className="absolute right-0 top-0 z-10 flex size-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm transition hover:brightness-110"
        >
          <X className="size-3" strokeWidth={3} />
        </button>
      )}

      {editing && (onMoveUp || onMoveDown) && (
        <div className="absolute left-0 top-0 z-10 flex flex-col gap-0.5 md:hidden">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            aria-label={`Mover ${account.name} para cima`}
            className="flex size-5 items-center justify-center rounded-full bg-black/40 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/60 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronUp className="size-3" strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            aria-label={`Mover ${account.name} para baixo`}
            className="flex size-5 items-center justify-center rounded-full bg-black/40 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/60 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronDown className="size-3" strokeWidth={3} />
          </button>
        </div>
      )}

      {editing ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar ${account.name}`}
          className="block w-full cursor-grab outline-none active:cursor-grabbing"
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
