import { useState } from "react"
import { ExternalLink, Pencil, ShoppingBag, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MoneyValue } from "@/components/MoneyValue"
import type { WishlistItem } from "../types"

interface ItemCardProps {
  item: WishlistItem
  onEdit: () => void
  onDelete: () => void
}

// A product tile in the "loja" grid: image, name and price. When it has a
// link the whole tile opens the store in a new tab; edit/delete appear on
// hover without triggering the link.
export function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  // Remote store images can hotlink-block (403) — fall back to the placeholder.
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = Boolean(item.imageUrl) && !imgFailed

  const inner = (
    <>
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {showImage ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="size-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ShoppingBag className="size-8 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-3">
        <p className="truncate text-sm font-medium" title={item.name}>
          {item.name}
        </p>
        <MoneyValue value={item.price} className="text-sm font-bold tracking-tight tabular-nums" />
        {item.url && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
            Ver na loja
            <ExternalLink className="size-3" />
          </span>
        )}
      </div>
    </>
  )

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/60 hover:shadow-[0_12px_36px_-14px_rgba(255,255,255,0.32)]">
      {item.url ? (
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

      <div className="absolute right-2 top-2 flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 bg-black/25 text-white backdrop-blur-sm hover:bg-black/40 hover:text-white"
          aria-label="Editar item"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onEdit()
          }}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="ml-1 size-7 bg-black/25 text-white backdrop-blur-sm hover:bg-black/40 hover:text-white"
          aria-label="Remover item"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
