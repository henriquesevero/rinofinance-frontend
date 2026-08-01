import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Eraser, FileUp, Gauge, Loader2, MoreHorizontal, Pencil, Trash2, Wallet } from "lucide-react"
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
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { CardFormDialog } from "./components/CardFormDialog"
import { CardLogo } from "./components/CardLogo"
import { CardSection } from "./components/CardSection"
import { ClearCardDialog } from "./components/ClearCardDialog"
import { ImportFaturaDialog } from "./components/ImportFaturaDialog"
import { computeCardStats } from "./cardStats"
import { useCardsStore } from "./store"

const dayCountdown = (days: number, verb: string) =>
  days === 0 ? `${verb} hoje` : `${verb} em ${days} ${days === 1 ? "dia" : "dias"}`

export function CardDetailPage() {
  const { cardId } = useParams<{ cardId: string }>()
  const navigate = useNavigate()
  const [isImporting, setIsImporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  // "Total que devo" mode: quitação (without this month's installment) vs
  // including the current month's parcela.
  const [owedMode, setOwedMode] = useState<"future" | "withCurrent">("future")
  const cards = useCardsStore((s) => s.cards)
  const isLoading = useCardsStore((s) => s.isLoading)
  const fetchCards = useCardsStore((s) => s.fetchCards)
  const deleteCard = useCardsStore((s) => s.deleteCard)
  const updateCard = useCardsStore((s) => s.updateCard)

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

  // The month's bill broken into its parts — shows what the fatura is made of.
  const breakdown = [
    { label: "Parcelas", value: stats.installmentMonthly, color: "bg-red-500" },
    { label: "Avulsas", value: stats.oneOffMonthly, color: "bg-orange-400" },
    { label: "Assinaturas", value: stats.subscriptionMonthly, color: "bg-violet-400" },
  ].filter((b) => b.value > 0)
  const breakdownTotal = breakdown.reduce((s, b) => s + b.value, 0)

  const usedPct = stats.limitUsedFraction === null ? null : Math.min(100, stats.limitUsedFraction * 100)

  return (
    <div className="flex flex-col gap-6">
      {/* top bar: back + actions */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/cards"
          viewTransition
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Cartões
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <ValuesVisibilityToggle />
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
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="size-4" />
                Editar cartão
              </DropdownMenuItem>
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

      {/* hero: a colored header (the card's own color, white text) — the
          equivalent of the account hero — over a neutral body that keeps the
          debt/limit figures readable in their semantic colors. */}
      {/* hero: the whole block filled with the card's color, all figures in
          white/translucent for contrast. */}
      <Card className="gap-0 overflow-hidden p-0">
        <div
          className="flex flex-col gap-3.5 p-4 text-white sm:p-5"
          style={{ background: `linear-gradient(150deg, ${card.color || "#6B7280"} 0%, rgba(0,0,0,0.5) 160%)` }}
        >
          {/* identity + bill */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <CardLogo name={card.name} color={card.color} logoUrl={card.logoUrl} className="size-9 shrink-0 ring-1 ring-white/30" />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold leading-tight tracking-tight drop-shadow">{card.name}</h1>
                <div className="mt-0.5 flex flex-col gap-y-0.5 text-xs drop-shadow sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-1.5 sm:[&>*+*]:before:mr-1.5 sm:[&>*+*]:before:text-white/40 sm:[&>*+*]:before:content-['·']">
                  {stats.daysUntilClose !== null && (
                    <span className="text-white/80">{dayCountdown(stats.daysUntilClose, "Fecha")}</span>
                  )}
                  {stats.daysUntilDue !== null && (
                    <span className="text-white/80">{dayCountdown(stats.daysUntilDue, "Vence")}</span>
                  )}
                  {stats.bestPurchaseDay !== null && (
                    <span className="text-emerald-200">Melhor dia {stats.bestPurchaseDay}</span>
                  )}
                  {stats.flaggedCount > 0 && (
                    <span className="text-amber-200">{stats.flaggedCount} em atenção</span>
                  )}
                  {stats.endingThisMonthCount > 0 && (
                    <span className="text-amber-200">
                      {stats.endingThisMonthCount} {stats.endingThisMonthCount === 1 ? "termina" : "terminam"} este mês
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">Fatura do mês</p>
              <MoneyValue
                value={card.monthlyTotal}
                className="block text-2xl font-bold tracking-tight tabular-nums drop-shadow"
              />
            </div>
          </div>

          {/* what the bill is made of — legend only (no bar) */}
          {breakdownTotal > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {breakdown.map((b) => (
                <span key={b.label} className="flex items-center gap-1.5 text-xs text-white/80">
                  <span className="size-2 rounded-full bg-white/70" />
                  {b.label}
                  <MoneyValue value={b.value} className="font-semibold tabular-nums text-white" />
                </span>
              ))}
            </div>
          )}

          {/* owed + limit, folded into the same panel */}
          <div className="grid grid-cols-1 border-t border-white/15 pt-3.5 sm:grid-cols-2">
            {/* Total que devo */}
            <div className="flex flex-col gap-1 pb-3.5 sm:pb-0 sm:pr-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Wallet className="size-3.5 shrink-0 text-white/70" />
                  <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-white/70">
                    Total que devo
                  </span>
                </div>
                <div className="flex shrink-0 rounded-md bg-white/15 p-0.5 text-[10px] font-medium">
                  {(["future", "withCurrent"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setOwedMode(m)}
                      className={cn(
                        "rounded px-1.5 py-0.5 transition-colors",
                        owedMode === m ? "bg-white text-black shadow-sm" : "text-white/70 hover:text-white"
                      )}
                    >
                      {m === "future" ? "Sem atual" : "Com atual"}
                    </button>
                  ))}
                </div>
              </div>
              <MoneyValue
                value={owedMode === "future" ? stats.totalOwed : stats.totalOwedWithCurrent}
                className="text-xl font-bold tracking-tight tabular-nums drop-shadow"
              />
              <p className="text-[11px] leading-tight text-white/60">
                {owedMode === "future" ? "quitação — sem a parcela deste mês" : "incluindo a parcela deste mês"}
              </p>
            </div>

            {/* Limite usado */}
            <div className="flex flex-col gap-1 border-t border-white/15 pt-3.5 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Gauge className="size-3.5 shrink-0 text-white/70" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Limite usado</span>
                </div>
                {usedPct !== null && (
                  <span className="text-xs font-medium text-white/70 tabular-nums">{Math.round(usedPct)}%</span>
                )}
              </div>
              {usedPct !== null ? (
                <>
                  <MoneyValue
                    value={Math.max(0, card.creditLimit - card.monthlyTotal)}
                    className="text-xl font-bold tracking-tight tabular-nums drop-shadow"
                  />
                  <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white/80 transition-[width] duration-500"
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] leading-tight text-white/60 tabular-nums">
                    disponível de <MoneyValue value={card.creditLimit} /> de limite
                  </p>
                </>
              ) : (
                <p className="text-sm text-white/70">Defina o limite ao editar o cartão.</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <CardSection card={card} />

      <ImportFaturaDialog open={isImporting} onOpenChange={setIsImporting} cardId={card.id} cardName={card.name} />
      <ClearCardDialog open={isClearing} onOpenChange={setIsClearing} card={card} />
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
        onDelete={handleDeleteCard}
      />
    </div>
  )
}
