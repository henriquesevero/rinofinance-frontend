import { useState } from "react"
import { ExternalLink, ShoppingBag, X } from "lucide-react"
import { MoneyValue } from "@/components/MoneyValue"
import { normalizeDomain } from "@/lib/brandLogo"
import { cn } from "@/lib/utils"
import type { ItemDnd } from "../WishlistPage"
import type { WishlistItem } from "../types"

interface ItemCardProps {
  item: WishlistItem
  sectionId: string
  editing: boolean
  dnd: ItemDnd
  onEdit: () => void
  onDelete: () => void
}

export function ItemCard({ item, sectionId, editing, dnd, onEdit, onDelete }: ItemCardProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const [over, setOver] = useState(false)
  const showImage = Boolean(item.imageUrl) && !imgFailed
  const store = item.url ? normalizeDomain(item.url) : ""
  const dragging = dnd.draggingId === item.id
  const isTarget = over && dnd.active && !dragging

  const inner = (
    <>
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {showImage ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ShoppingBag className="size-8 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="truncate text-sm font-medium leading-tight" title={item.name}>
          {item.name}
        </p>
        <MoneyValue value={item.price} className="text-base font-bold tracking-tight tabular-nums" />
        {store && !editing && (
          <span className="mt-auto flex items-center gap-1 truncate pt-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
            <span className="truncate">{store}</span>
            <ExternalLink className="size-3 shrink-0" />
          </span>
        )}
      </div>
    </>
  )

  return (
    <div
      draggable={editing}
      onDragStart={
        editing
          ? (e) => {
              e.dataTransfer.effectAllowed = "move"
              dnd.start(item.id)
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
              dnd.drop(sectionId, item.id)
            }
          : undefined
      }
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 ease-out",
        editing && "cursor-grab active:cursor-grabbing",
        !editing && "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_12px_36px_-14px_rgba(97,218,251,0.4)]",
        isTarget && "border-primary ring-2 ring-primary/60",
        dragging && "opacity-40"
      )}
    >
      {editing && (
        <button
          type="button"
          aria-label={`Remover ${item.name}`}
          onClick={onDelete}
          className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-destructive text-white shadow-sm transition hover:brightness-110"
        >
          <X className="size-4" strokeWidth={3} />
        </button>
      )}

      {editing ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar ${item.name}`}
          className="flex min-w-0 flex-1 cursor-grab flex-col text-left outline-none active:cursor-grabbing"
        >
          {inner}
        </button>
      ) : item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 flex-col outline-none"
        >
          {inner}
        </a>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col">{inner}</div>
      )}
    </div>
  )
}
