import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, GripVertical, Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { CardFormDialog } from "./components/CardFormDialog"
import { CardCarousel } from "./components/CardCarousel"
import { CardOverviewTile } from "./components/CardOverviewTile"
import { computeCardStats } from "./cardStats"
import { useMonthStore } from "@/lib/monthStore"
import { useCardsStore } from "./store"
import type { CardOverview } from "./types"

const dayCountdown = (days: number, verb: string) =>
  days === 0 ? `${verb} hoje` : `${verb} em ${days} ${days === 1 ? "dia" : "dias"}`

export function CardsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CardOverview | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const cards = useCardsStore((s) => s.cards)
  const grandTotal = useCardsStore((s) => s.grandTotal)
  const isLoading = useCardsStore((s) => s.isLoading)
  const error = useCardsStore((s) => s.error)
  const fetchCards = useCardsStore((s) => s.fetchCards)
  const createCard = useCardsStore((s) => s.createCard)
  const updateCard = useCardsStore((s) => s.updateCard)
  const deleteCard = useCardsStore((s) => s.deleteCard)
  const reorderCards = useCardsStore((s) => s.reorderCards)
  const month = useMonthStore((s) => s.month)

  const [order, setOrder] = useState<CardOverview[]>(cards)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const orderBeforeDrag = useRef<string[]>([])

  useEffect(() => {
    fetchCards()
  }, [fetchCards, month])

  useEffect(() => {
    setOrder(cards)
  }, [cards])

  useEffect(() => {
    if (activeIndex >= cards.length) setActiveIndex(Math.max(0, cards.length - 1))
  }, [cards.length, activeIndex])

  const { totalOwed, totalLimit } = useMemo(() => {
    let totalOwed = 0
    let totalLimit = 0
    for (const c of cards) {
      totalOwed += computeCardStats(c, month).totalOwed
      totalLimit += c.creditLimit
    }
    return { totalOwed, totalLimit }
  }, [cards, month])
  const freeLimit = totalLimit - grandTotal
  const usedPct = totalLimit > 0 ? Math.min(100, (grandTotal / totalLimit) * 100) : null

  const activeCard = cards[activeIndex] ?? null
  const activeStats = activeCard ? computeCardStats(activeCard, month) : null
  const activeFreeLimit = activeCard ? Math.max(0, activeCard.creditLimit - activeCard.monthlyTotal) : 0
  const activeUsedPct =
    activeStats?.limitUsedFraction !== null && activeStats?.limitUsedFraction !== undefined
      ? Math.min(100, activeStats.limitUsedFraction * 100)
      : null


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
          <h1 className="text-3xl font-extrabold tracking-tight">Cartões</h1>
          <p className="hidden text-muted-foreground sm:block">Faturas, limites e parcelas dos seus cartões.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ValuesVisibilityToggle />
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => setIsCreateOpen(true)}
            aria-label="Novo cartão"
            title="Novo cartão"
          >
            <Plus className="size-5" />
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Nenhum cartão cadastrado ainda.</p>
      ) : (
        <>
          {/* Mobile: swipeable carousel with per-card limit/invoice info */}
          <div className="flex flex-col gap-6 md:hidden">
            <CardCarousel
              cards={cards}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              onEditCard={setEditingCard}
            />

            {activeCard && activeStats && (
              <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
                <Link
                  to={`/cards/${activeCard.id}`}
                  viewTransition
                  className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50"
                >
                  <span className="text-sm font-medium">Limite disponível</span>
                  <span className="flex items-center gap-1.5">
                    {activeCard.creditLimit > 0 ? (
                      <MoneyValue
                        value={activeFreeLimit}
                        className={cn(
                          "font-bold tabular-nums",
                          activeFreeLimit >= 0 ? "text-emerald-500" : "text-red-500"
                        )}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">Definir limite</span>
                    )}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </span>
                </Link>

                <Card className="gap-3 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Fatura do mês
                      </p>
                      <MoneyValue
                        value={activeCard.monthlyTotal}
                        className="text-2xl font-bold tracking-tight tabular-nums text-red-500"
                      />
                    </div>
                    {activeStats.daysUntilDue !== null && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {activeStats.daysUntilDue === 0
                          ? "Vence hoje"
                          : `Vence em ${activeStats.daysUntilDue} ${activeStats.daysUntilDue === 1 ? "dia" : "dias"}`}
                      </span>
                    )}
                  </div>

                  {activeStats.bestPurchaseDay !== null && (
                    <p className="text-xs text-muted-foreground">
                      Melhor dia para compras: dia {activeStats.bestPurchaseDay}
                    </p>
                  )}

                  {activeUsedPct !== null && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-red-500 transition-[width] duration-500"
                        style={{ width: `${activeUsedPct}%` }}
                      />
                    </div>
                  )}

                  <Link
                    to={`/cards/${activeCard.id}`}
                    viewTransition
                    className="mt-1 flex w-full items-center justify-center rounded-full border border-primary/30 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                  >
                    Ver fatura completa
                  </Link>
                </Card>

                <Card className="gap-3 p-4 sm:p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Informações do cartão
                  </p>

                  <div className="flex flex-col divide-y divide-border">
                    <div className="flex items-center justify-between py-2 first:pt-0">
                      <span className="text-sm text-muted-foreground">Melhor dia de compra</span>
                      <span className="text-sm font-semibold">
                        {activeStats.bestPurchaseDay !== null ? `Dia ${activeStats.bestPurchaseDay}` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Fechamento da fatura</span>
                      <span className="text-sm font-semibold">
                        {activeCard.closingDay ? `Dia ${activeCard.closingDay}` : "—"}
                        {activeStats.daysUntilClose !== null && (
                          <span className="ml-1.5 font-normal text-muted-foreground">
                            · {dayCountdown(activeStats.daysUntilClose, "Fecha")}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 last:pb-0">
                      <span className="text-sm text-muted-foreground">Vencimento</span>
                      <span className="text-sm font-semibold">
                        {activeCard.dueDay ? `Dia ${activeCard.dueDay}` : "—"}
                        {activeStats.daysUntilDue !== null && (
                          <span className="ml-1.5 font-normal text-muted-foreground">
                            · {dayCountdown(activeStats.daysUntilDue, "Vence")}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Desktop: aggregate summary + reorderable grid */}
          <div className="hidden flex-col gap-6 md:flex">
            <Card className="gap-0 overflow-hidden p-0">
              <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
                <div className="col-span-2 flex flex-col justify-center gap-0.5 bg-card p-3.5 sm:col-span-1 sm:gap-1 sm:p-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Fatura do mês
                  </span>
                  <MoneyValue
                    value={grandTotal}
                    className="text-xl font-bold tracking-tight tabular-nums text-red-500 sm:text-2xl"
                  />
                  <span className="text-xs text-muted-foreground">soma das faturas de todos os cartões</span>
                </div>

                <div className="flex flex-col justify-center gap-0.5 bg-card p-3.5 sm:gap-1 sm:p-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Total que devo
                  </span>
                  <MoneyValue
                    value={totalOwed}
                    className="text-xl font-bold tracking-tight tabular-nums text-red-500 sm:text-2xl"
                  />
                  <span className="text-xs text-muted-foreground">quitação — parcelas ainda a pagar</span>
                </div>

                <div className="flex flex-col justify-center gap-1.5 bg-card p-3.5 sm:gap-2 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Limite disponível
                    </span>
                    {usedPct !== null && (
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {Math.round(usedPct)}% usado
                      </span>
                    )}
                  </div>
                  {totalLimit > 0 ? (
                    <>
                      <MoneyValue
                        value={freeLimit}
                        className={cn(
                          "text-xl font-bold tracking-tight tabular-nums sm:text-2xl",
                          freeLimit >= 0 ? "text-emerald-500" : "text-red-500"
                        )}
                      />
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-red-500 transition-[width] duration-500"
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Defina o limite dos cartões</span>
                  )}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {order.map((card) => (
                <div
                  key={card.id}
                  data-card-tile
                  className={cn("group/drag relative transition-opacity", draggingId === card.id && "opacity-40")}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => handleDragEnter(card.id)}
                  onDrop={(e) => e.preventDefault()}
                >
                  <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
                    <span
                      draggable
                      onDragStart={(e) => {
                        orderBeforeDrag.current = order.map((c) => c.id)
                        setDraggingId(card.id)
                        const tile = e.currentTarget.closest("[data-card-tile]")
                        if (tile) e.dataTransfer.setDragImage(tile, 20, 20)
                        e.dataTransfer.effectAllowed = "move"
                      }}
                      onDragEnd={handleDragEnd}
                      title="Arraste para reordenar"
                      aria-label="Arraste para reordenar"
                      className="hidden size-6 cursor-grab items-center justify-center rounded-md bg-black/30 text-white/90 opacity-0 backdrop-blur-sm transition hover:bg-black/50 group-hover/drag:opacity-100 active:cursor-grabbing sm:flex"
                    >
                      <GripVertical className="size-3.5" />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setEditingCard(card)
                      }}
                      title="Editar cartão"
                      aria-label="Editar cartão"
                      className="flex size-6 items-center justify-center rounded-md bg-black/30 text-white/90 opacity-0 backdrop-blur-sm transition hover:bg-black/50 group-hover/drag:opacity-100"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>
                  <CardOverviewTile card={card} />
                </div>
              ))}
            </div>
          </div>
        </>
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
                brand: editingCard.brand ?? "",
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
        onDelete={
          editingCard
            ? async () => {
                try {
                  await deleteCard(editingCard.id)
                  toast.success("Cartão removido")
                  setEditingCard(null)
                } catch (err) {
                  toast.error(toErrorMessage(err))
                  throw err
                }
              }
            : undefined
        }
      />
    </div>
  )
}
