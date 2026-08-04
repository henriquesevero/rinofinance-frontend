import { useState, type ReactNode } from "react"
import { ExternalLink, ShoppingBag, X } from "lucide-react"
import { MoneyValue } from "@/components/MoneyValue"
import { normalizeDomain } from "@/lib/brandLogo"
import { cn } from "@/lib/utils"
import type { WishlistItem } from "../types"

interface ItemCardProps {
  item: WishlistItem
  editing: boolean
  onEdit: () => void
  onDelete: () => void
  reorderProps?: React.HTMLAttributes<HTMLDivElement>
  dragHandle?: ReactNode
  dragging?: boolean
}

export function ItemCard({ item, editing, onEdit, onDelete, reorderProps, dragHandle, dragging }: ItemCardProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = Boolean(item.imageUrl) && !imgFailed
  const store = item.url ? normalizeDomain(item.url) : ""

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
      {...reorderProps}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 ease-out",
        !editing && "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_12px_36px_-14px_rgba(97,218,251,0.4)]",
        dragging && "opacity-40"
      )}
    >
      {editing && dragHandle && (
        <div className="absolute left-2 top-2 z-10 flex size-7 items-center justify-center rounded-md bg-black/35 text-white shadow-sm backdrop-blur-sm">
          {dragHandle}
        </div>
      )}

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
          className="flex min-w-0 flex-1 flex-col text-left outline-none"
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
