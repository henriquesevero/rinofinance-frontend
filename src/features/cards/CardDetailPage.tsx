import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarCheck2, CalendarClock, CreditCard, Eraser, FileUp, Loader2, MoreHorizontal, Trash2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { CardLogo } from "./components/CardLogo"
import { CardSection } from "./components/CardSection"
import { ClearCardDialog } from "./components/ClearCardDialog"
import { ImportFaturaDialog } from "./components/ImportFaturaDialog"
import { computeCardStats } from "./cardStats"
import { useCardsStore } from "./store"

function dayCount(days: number) {
  return `${days} ${days === 1 ? "dia" : "dias"}`
}

export function CardDetailPage() {
  const { cardId } = useParams<{ cardId: string }>()
  const navigate = useNavigate()
  const [isImporting, setIsImporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const cards = useCardsStore((s) => s.cards)
  const isLoading = useCardsStore((s) => s.isLoading)
  const fetchCards = useCardsStore((s) => s.fetchCards)
  const deleteCard = useCardsStore((s) => s.deleteCard)

  async function handleDeleteCard() {
    try {
      await deleteCard(cardId!)
      toast.success("Cartão removido")
      navigate("/cards")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

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
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => setIsImporting(true)}
            aria-label="Importar fatura"
            title="Importar fatura"
          >
            <FileUp className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-9" aria-label="Mais opções" title="Mais opções">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsClearing(true)}>
                <Eraser className="size-4" />
                Limpar fatura
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteCard} className="text-destructive">
                <Trash2 className="size-4" />
                Excluir cartão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CreditCard}
          label="Fatura do mês"
          value={<MoneyValue value={card.monthlyTotal} />}
          sub="parcelas, compras avulsas e assinaturas"
        />
        <StatCard
          icon={Wallet}
          danger
          label="Total que devo"
          value={<MoneyValue value={stats.totalOwed} />}
          sub="quitação das parcelas restantes"
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
            positive
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

      <CardSection card={card} />

      <ImportFaturaDialog open={isImporting} onOpenChange={setIsImporting} cardId={card.id} cardName={card.name} />
      <ClearCardDialog open={isClearing} onOpenChange={setIsClearing} card={card} />

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
  danger,
  positive,
  muted,
}: {
  icon: typeof CreditCard
  label: string
  value: React.ReactNode
  sub?: string
  accent?: boolean
  danger?: boolean
  positive?: boolean
  muted?: boolean
}) {
  return (
    <Card className="flex flex-col gap-1 p-3.5">
      <div className="flex items-center gap-1.5">
        <Icon
          className={cn(
            "size-3",
            accent ? "text-cyan-500" : danger ? "text-red-500" : positive ? "text-emerald-500" : "text-muted-foreground"
          )}
        />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <div
        className={cn(
          "text-lg font-bold tracking-tight tabular-nums",
          accent && "text-cyan-500",
          danger && "text-red-500",
          positive && "text-emerald-500",
          muted && "text-muted-foreground"
        )}
      >
        {value}
      </div>
      {sub && <p className="text-[11px] leading-tight text-muted-foreground">{sub}</p>}
    </Card>
  )
}
