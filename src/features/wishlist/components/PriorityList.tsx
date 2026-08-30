import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, ExternalLink, MoreHorizontal, Pencil, ShoppingBag, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DragHandle } from "@/components/DragHandle"
import { normalizeDomain } from "@/lib/brandLogo"
import { useReorder } from "@/lib/useReorder"
import { cn } from "@/lib/utils"
import type { WishlistItem, WishlistSection } from "../types"

const NONE = "__none__"

interface PriorityListProps {
  items: WishlistItem[]
  sections: WishlistSection[]
  onReorder: (ids: string[]) => void
  onEdit: (item: WishlistItem) => void
  onDelete: (item: WishlistItem) => void
}

export function PriorityList({ items, sections, onReorder, onEdit, onDelete }: PriorityListProps) {
  const groupOrder = useMemo(() => [...sections.map((s) => s.id), NONE], [sections])

  const groups = useMemo(() => {
    const map = new Map<string, WishlistItem[]>()
    for (const key of groupOrder) map.set(key, [])
    for (const item of items) {
      const key = item.sectionId ?? NONE
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.priority - b.priority)
    return map
  }, [items, groupOrder])

  function persistGroupOrder(groupKey: string, orderedIds: string[]) {
    const byId = new Map((groups.get(groupKey) ?? []).map((item) => [item.id, item]))
    const reordered = orderedIds.map((id) => byId.get(id)).filter((item): item is WishlistItem => Boolean(item))
    const next = new Map(groups)
    next.set(groupKey, reordered)
    const flattened = groupOrder.flatMap((key) => next.get(key) ?? [])
    onReorder(flattened.map((item) => item.id))
  }

  const visibleGroups = [
    ...sections.map((s) => ({ key: s.id, name: s.name, color: s.color as string | undefined })),
    { key: NONE, name: "Sem seção", color: undefined },
  ].filter((g) => (groups.get(g.key) ?? []).length > 0)

  if (visibleGroups.length === 0) return null

  return (
    <div className="scrollbar-hide flex flex-col gap-6 md:flex-row md:items-start md:gap-4 md:overflow-x-auto md:pb-2">
      {visibleGroups.map((group) => (
        <PriorityGroup
          key={group.key}
          name={group.name}
          color={group.color}
          items={groups.get(group.key) ?? []}
          onReorder={(ids) => persistGroupOrder(group.key, ids)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

function PriorityGroup({
  name,
  color,
  items,
  onReorder,
  onEdit,
  onDelete,
}: {
  name: string
  color?: string
  items: WishlistItem[]
  onReorder: (ids: string[]) => void
  onEdit: (item: WishlistItem) => void
  onDelete: (item: WishlistItem) => void
}) {
  const reorder = useReorder(items, onReorder)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <section className="flex flex-col gap-2 md:w-80 md:shrink-0 md:rounded-xl md:border md:border-border/60 md:bg-muted/20 md:p-3">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        className="flex min-w-0 items-center gap-1.5 px-0.5 text-left"
      >
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", collapsed && "-rotate-90")}
        />
        {color && <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
        <h3
          className={cn("truncate text-sm font-semibold tracking-wide", !color && "text-muted-foreground")}
          style={color ? { color } : undefined}
        >
          {name}
        </h3>
        <span className="shrink-0 text-xs text-muted-foreground">({items.length})</span>
      </button>
      {!collapsed && (
        <ol className="scrollbar-hide flex flex-col gap-2 md:max-h-[65vh] md:overflow-y-auto md:pr-0.5">
          {reorder.order.map((item, index) => (
            <PriorityRow
              key={item.id}
              item={item}
              rank={index + 1}
              dragging={reorder.draggingId === item.id}
              itemProps={reorder.getItemProps(item.id)}
              handleProps={reorder.getHandleProps(item.id)}
              onMoveUp={index > 0 ? () => reorder.moveBy(item.id, -1) : undefined}
              onMoveDown={index < reorder.order.length - 1 ? () => reorder.moveBy(item.id, 1) : undefined}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          ))}
        </ol>
      )}
    </section>
  )
}

function PriorityRow({
  item,
  rank,
  dragging,
  itemProps,
  handleProps,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  item: WishlistItem
  rank: number
  dragging: boolean
  itemProps: React.HTMLAttributes<HTMLElement>
  handleProps: React.HTMLAttributes<HTMLSpanElement> & { draggable?: boolean }
  onMoveUp?: () => void
  onMoveDown?: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const store = item.url ? normalizeDomain(item.url) : ""

  return (
    <li
      {...itemProps}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 transition-colors hover:border-foreground/20",
        dragging && "opacity-40"
      )}
    >
      <DragHandle {...handleProps} className="hidden shrink-0 opacity-0 group-hover:opacity-100 sm:block" />

      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
          rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {rank}
      </span>

      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="size-full object-cover" loading="lazy" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ShoppingBag className="size-5 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-tight" title={item.name}>
          {item.name}
        </p>
        {store && <p className="truncate text-xs text-muted-foreground">{store}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <div className="flex flex-col gap-0.5 sm:hidden">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            aria-label={`Mover ${item.name} para cima`}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            aria-label={`Mover ${item.name} para baixo`}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="size-8" aria-label="Ações do item" title="Ações">
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent>
            {item.url && (
              <DropdownMenuItem onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}>
                <ExternalLink className="size-4" />
                Abrir link
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="size-4" />
              Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}
