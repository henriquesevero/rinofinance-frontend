import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarCheck2, CalendarClock, CreditCard, Loader2, Pencil, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { CardLogo } from "./components/CardLogo"
import { CardFormDialog } from "./components/CardFormDialog"
import { CardSection } from "./components/CardSection"
import { computeCardStats } from "./cardStats"
import { useCardsStore } from "./store"

function dayCount(days: number) {
  return `${days} ${days === 1 ? "dia" : "dias"}`
}

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

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/cards"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Cartões
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CardLogo name={card.name} color={card.color} logoUrl={card.logoUrl} className="size-10 shrink-0" />
          <h1 className="truncate text-2xl font-bold tracking-tight">{card.name}</h1>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => setIsEditing(true)}>
          <Pencil className="size-4" />
          Editar
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CreditCard}
          accent
          label="Fatura do mês"
          value={<MoneyValue value={card.monthlyTotal} />}
        />
        <StatCard
          icon={Wallet}
          label="Total que devo"
          value={<MoneyValue value={stats.totalOwed} />}
          sub="parcelas restantes de todas as compras"
        />
        {stats.daysUntilDue !== null ? (
          <StatCard
            icon={CalendarClock}
            label="Vencimento"
            value={`Dia ${card.dueDay}`}
            sub={stats.daysUntilDue === 0 ? "vence hoje" : `vence em ${dayCount(stats.daysUntilDue)}`}
          />
        ) : (
          <StatCard icon={CalendarClock} label="Vencimento" value="—" sub="defina o dia de vencimento" muted />
        )}
        {stats.bestPurchaseDay !== null ? (
          <StatCard
            icon={CalendarCheck2}
            label="Melhor dia de compra"
            value={`Dia ${stats.bestPurchaseDay}`}
            sub={`fatura fecha dia ${card.closingDay}`}
          />
        ) : (
          <StatCard
            icon={CalendarCheck2}
            label="Melhor dia de compra"
            value="—"
            sub="defina o dia de fechamento"
            muted
          />
        )}
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
          closingDay: card.closingDay ?? 0,
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

// A single metric tile in the card's stat grid: icon + uppercase label +
// prominent value, with an optional sub-line for context.
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  muted,
}: {
  icon: typeof CreditCard
  label: string
  value: React.ReactNode
  sub?: string
  accent?: boolean
  muted?: boolean
}) {
  return (
    <Card className="flex flex-col gap-1 p-3.5">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("size-3", accent ? "text-cyan-500" : "text-muted-foreground")} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <div
        className={cn(
          "text-lg font-bold tracking-tight tabular-nums",
          accent && "text-cyan-500",
          muted && "text-muted-foreground"
        )}
      >
        {value}
      </div>
      {sub && <p className="text-[11px] leading-tight text-muted-foreground">{sub}</p>}
    </Card>
  )
}
