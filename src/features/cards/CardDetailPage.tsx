import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarClock, CreditCard, Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { MoneyValue } from "@/components/MoneyValue"
import { toErrorMessage } from "@/lib/errors"
import { CardArt } from "./components/CardArt"
import { CardFormDialog } from "./components/CardFormDialog"
import { CardSection } from "./components/CardSection"
import { computeCardStats } from "./cardStats"
import { useCardsStore } from "./store"

export function CardDetailPage() {
  const { cardId } = useParams<{ cardId: string }>()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const cards = useCardsStore((s) => s.cards)
  const isLoading = useCardsStore((s) => s.isLoading)
  const fetchCards = useCardsStore((s) => s.fetchCards)
  const updateCard = useCardsStore((s) => s.updateCard)

  // Cards may not be loaded yet on a fresh page load / refresh straight
  // onto this route.
  useEffect(() => {
    if (cards.length === 0) fetchCards()
  }, [cards.length, fetchCards])

  const card = cards.find((c) => c.id === cardId)

  if (!card) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Carregando...
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-muted-foreground">Cartão não encontrado.</p>
        <Link to="/cards" className="text-sm font-medium text-primary hover:underline">
          Voltar aos cartões
        </Link>
      </div>
    )
  }

  const stats = computeCardStats(card)
  const usedPct = stats.limitUsedFraction === null ? null : Math.round(stats.limitUsedFraction * 100)

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/cards"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Cartões
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="group relative w-full max-w-[300px] shrink-0">
          <CardArt card={card} />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar cartão"
            onClick={() => setIsEditing(true)}
            className="absolute right-2 top-2 size-8 bg-black/25 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/40 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Pencil className="size-4" />
          </Button>
        </div>
        <dl className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Fatura do mês</dt>
            <dd className="text-3xl font-bold tracking-tight">
              <MoneyValue value={card.monthlyTotal} />
            </dd>
          </div>
          {card.creditLimit > 0 && (
            <div className="flex flex-col gap-1">
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <CreditCard className="size-3.5" />
                Limite
              </dt>
              <dd className="text-xl font-semibold">
                <MoneyValue value={card.creditLimit} />
              </dd>
              {usedPct !== null && <span className="text-xs text-muted-foreground">{usedPct}% usado</span>}
            </div>
          )}
          {stats.daysUntilDue !== null && (
            <div className="flex flex-col gap-1">
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5" />
                Vencimento
              </dt>
              <dd className="text-xl font-semibold">dia {card.dueDay}</dd>
              <span className="text-xs text-muted-foreground">
                {stats.daysUntilDue === 0 ? "vence hoje" : `em ${stats.daysUntilDue} dias`}
              </span>
            </div>
          )}
        </dl>
      </div>

      <CardSection card={card} onDeleted={() => navigate("/cards")} />

      <CardFormDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        initial={{
          name: card.name,
          color: card.color ?? "",
          logoUrl: card.logoUrl ?? "",
          imageUrl: card.imageUrl ?? "",
          creditLimit: card.creditLimit,
          dueDay: card.dueDay ?? 0,
        }}
        onSubmit={async (input) => {
          try {
            await updateCard(card.id, input)
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
