import { useEffect, useRef, useState } from "react"
import { CreditCard, GripVertical, Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { CardFormDialog } from "./components/CardFormDialog"
import { CardOverviewTile } from "./components/CardOverviewTile"
import { useMonthStore } from "@/lib/monthStore"
import { useCardsStore } from "./store"
import type { CardOverview } from "./types"

export function CardsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CardOverview | null>(null)
  const cards = useCardsStore((s) => s.cards)
  const grandTotal = useCardsStore((s) => s.grandTotal)
  const isLoading = useCardsStore((s) => s.isLoading)
  const error = useCardsStore((s) => s.error)
  const fetchCards = useCardsStore((s) => s.fetchCards)
  const createCard = useCardsStore((s) => s.createCard)
  const updateCard = useCardsStore((s) => s.updateCard)
  const reorderCards = useCardsStore((s) => s.reorderCards)
  const month = useMonthStore((s) => s.month)

  // Local working copy so drag reordering feels instant; kept in sync with
  // the store's order whenever it changes.
  const [order, setOrder] = useState<CardOverview[]>(cards)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const orderBeforeDrag = useRef<string[]>([])

  useEffect(() => {
    fetchCards()
  }, [fetchCards, month])

  useEffect(() => {
    setOrder(cards)
  }, [cards])

  function handleDragEnter(overId: string) {
    if (!draggingId || draggingId === overId) return
    setOrder((prev) => {
      const from = prev.findIndex((c) => c.id === draggingId)
      const to = prev.findIndex((c) => c.id === overId)
      if (from === -1 || to === -1 || from === to) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  function handleDragEnd() {
    setDraggingId(null)
    const newIds = order.map((c) => c.id)
    const changed = newIds.some((id, i) => id !== orderBeforeDrag.current[i])
    if (changed) {
      reorderCards(newIds).catch(() => toast.error("Não foi possível salvar a nova ordem"))
    }
  }

  if (isLoading && cards.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Carregando cartões...
      </div>
    )
  }

  if (error && cards.length === 0) {
    return <p className="text-center text-destructive">{error}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cartões</h1>
          <p className="text-muted-foreground">Faturas, limites e parcelas dos seus cartões.</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => setIsCreateOpen(true)}
          aria-label="Novo cartão"
          title="Novo cartão"
        >
          <Plus className="size-5" />
        </Button>
      </div>

      {/* total geral — compacto e discreto */}
      <Card className="flex w-full flex-col gap-1 p-4 sm:max-w-[13rem]">
        <div className="flex items-center gap-1.5">
          <CreditCard className="size-3.5 text-red-500" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Total geral · mês atual
          </h2>
        </div>
        <MoneyValue value={grandTotal} className="text-xl font-bold tracking-tight tabular-nums text-red-500" />
      </Card>

      {order.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Nenhum cartão cadastrado ainda.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {order.map((card) => (
            <div
              key={card.id}
              className={cn("group/drag relative transition-opacity", draggingId === card.id && "opacity-40")}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => handleDragEnter(card.id)}
              onDrop={(e) => e.preventDefault()}
            >
              <div
                draggable
                onDragStart={(e) => {
                  orderBeforeDrag.current = order.map((c) => c.id)
                  setDraggingId(card.id)
                  const tile = e.currentTarget.parentElement
                  if (tile) e.dataTransfer.setDragImage(tile, 20, 20)
                  e.dataTransfer.effectAllowed = "move"
                }}
                onDragEnd={handleDragEnd}
                title="Arraste para reordenar"
                aria-label="Arraste para reordenar"
                className="absolute left-3 top-3 z-10 cursor-grab rounded-md bg-black/25 p-1 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/40 group-hover/drag:opacity-100 active:cursor-grabbing"
              >
                <GripVertical className="size-4" />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setEditingCard(card)
                }}
                title="Editar cartão"
                aria-label="Editar cartão"
                className="absolute right-3 top-3 z-10 rounded-md bg-black/25 p-1 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/40 group-hover/drag:opacity-100"
              >
                <Pencil className="size-4" />
              </button>
              <CardOverviewTile card={card} />
            </div>
          ))}
        </div>
      )}

      <CardFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={async (input) => {
          try {
            await createCard(input)
            toast.success("Cartão criado")
          } catch (err) {
            toast.error(toErrorMessage(err))
            throw err
          }
        }}
      />

      <CardFormDialog
        open={editingCard !== null}
        onOpenChange={(open) => !open && setEditingCard(null)}
        initial={
          editingCard
            ? {
                name: editingCard.name,
                color: editingCard.color ?? "",
                logoUrl: editingCard.logoUrl ?? "",
                imageUrl: editingCard.imageUrl ?? "",
                creditLimit: editingCard.creditLimit,
                dueDay: editingCard.dueDay ?? 0,
                closingDay: editingCard.closingDay ?? 0,
              }
            : undefined
        }
        onSubmit={async (input) => {
          if (!editingCard) return
          try {
            await updateCard(editingCard.id, input)
            toast.success("Cartão atualizado")
          } catch (err) {
            toast.error(toErrorMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
