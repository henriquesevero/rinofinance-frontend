import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  Eraser,
  FileUp,
  Flag,
  Gauge,
  Loader2,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react"
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

      {/* hero: identity, countdowns, the bill, and what it's made of */}
      <Card className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <CardLogo name={card.name} color={card.color} logoUrl={card.logoUrl} className="size-8 shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-tight">{card.name}</h1>
          </div>
        </div>

        {/* countdown / status chips */}
        {(stats.daysUntilClose !== null ||
          stats.daysUntilDue !== null ||
          stats.bestPurchaseDay !== null ||
          stats.flaggedCount > 0 ||
          stats.endingThisMonthCount > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {stats.daysUntilClose !== null && (
              <Chip icon={CalendarClock}>{dayCountdown(stats.daysUntilClose, "Fecha")}</Chip>
            )}
            {stats.daysUntilDue !== null && (
              <Chip icon={CalendarDays}>{dayCountdown(stats.daysUntilDue, "Vence")}</Chip>
            )}
            {stats.bestPurchaseDay !== null && (
              <Chip icon={Sparkles} tone="green">
                Melhor compra dia {stats.bestPurchaseDay}
              </Chip>
            )}
            {stats.flaggedCount > 0 && (
              <Chip icon={Flag} tone="amber">
                {stats.flaggedCount} em atenção
              </Chip>
            )}
            {stats.endingThisMonthCount > 0 && (
              <Chip icon={Sparkles} tone="amber">
                {stats.endingThisMonthCount} {stats.endingThisMonthCount === 1 ? "termina" : "terminam"} este mês
              </Chip>
            )}
          </div>
        )}

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Fatura do mês</p>
          <MoneyValue
            value={card.monthlyTotal}
            className="mt-0.5 block text-2xl font-bold tracking-tight tabular-nums sm:text-3xl"
          />
        </div>

        {/* what the bill is made of */}
        {breakdownTotal > 0 && (
          <div className="flex flex-col gap-2.5">
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              {breakdown.map((b) => (
                <div
                  key={b.label}
                  className={cn("h-full transition-[width] duration-500", b.color)}
                  style={{ width: `${(b.value / breakdownTotal) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {breakdown.map((b) => (
                <span key={b.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn("size-2 rounded-full", b.color)} />
                  {b.label}
                  <MoneyValue value={b.value} className="font-semibold tabular-nums text-foreground" />
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* supporting metrics: what I still owe + limit headroom */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-1.5 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <Wallet className="size-3.5 shrink-0 text-red-500" />
              <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Total que devo
              </span>
            </div>
            <div className="flex shrink-0 rounded-md bg-muted p-0.5 text-[10px] font-medium">
              {(["future", "withCurrent"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setOwedMode(m)}
                  className={cn(
                    "rounded px-1.5 py-0.5 transition-colors",
                    owedMode === m
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "future" ? "Sem atual" : "Com atual"}
                </button>
              ))}
            </div>
          </div>
          <MoneyValue
            value={owedMode === "future" ? stats.totalOwed : stats.totalOwedWithCurrent}
            className="text-xl font-bold tracking-tight tabular-nums text-red-500"
          />
          <p className="text-[11px] leading-tight text-muted-foreground">
            {owedMode === "future" ? "quitação — sem a parcela deste mês" : "incluindo a parcela deste mês"}
          </p>
        </Card>

        <Card className="flex flex-col gap-1.5 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Gauge className="size-3.5 shrink-0 text-red-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Limite usado
              </span>
            </div>
            {usedPct !== null && (
              <span className="text-xs font-medium text-muted-foreground tabular-nums">{Math.round(usedPct)}%</span>
            )}
          </div>
          {usedPct !== null ? (
            <>
              <MoneyValue
                value={Math.max(0, card.creditLimit - card.monthlyTotal)}
                className="text-xl font-bold tracking-tight tabular-nums text-emerald-500"
              />
              <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-red-500 transition-[width] duration-500"
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <p className="text-[11px] leading-tight text-muted-foreground tabular-nums">
                disponível de <MoneyValue value={card.creditLimit} /> de limite
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Defina o limite ao editar o cartão.</p>
          )}
        </Card>
      </div>

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
      />
    </div>
  )
}

// A small rounded status pill used for the card's countdowns and alerts.
function Chip({
  icon: Icon,
  children,
  tone = "muted",
}: {
  icon: typeof CalendarDays
  children: React.ReactNode
  tone?: "muted" | "green" | "amber"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tone === "green" && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
        tone === "amber" && "border-amber-500/30 text-amber-600 dark:text-amber-400",
        tone === "muted" && "border-border text-muted-foreground"
      )}
    >
      <Icon className="size-3" />
      {children}
    </span>
  )
}
