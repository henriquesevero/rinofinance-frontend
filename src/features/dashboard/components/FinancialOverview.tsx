import { useEffect } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, CreditCard, Landmark, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { AccountAvatar } from "@/features/accounts/components/AccountAvatar"
import { CardLogo } from "@/features/cards/components/CardLogo"
import { useAccountsStore } from "@/features/accounts/store"
import { useCardsStore } from "@/features/cards/store"
import { useInvestmentsStore } from "@/features/investments/store"
import { useMonthStore } from "@/lib/monthStore"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/money"

const pctOf = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0)
const fmtPct = (v: number) => `${v.toFixed(1)}%`

export function FinancialOverview() {
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)
  const fetchAssets = useInvestmentsStore((s) => s.fetchAssets)
  const month = useMonthStore((s) => s.month)

  useEffect(() => {
    fetchAccounts()
    fetchAssets()
  }, [fetchAccounts, fetchAssets, month])

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <AccountsCard />
      <CardsCard />
      <InvestmentsCard />
    </div>
  )
}

function SectionHeader({ icon: Icon, label, accent }: { icon: typeof Landmark; label: string; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("size-4", accent)} />
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h2>
    </div>
  )
}

function EmptyState({ icon: Icon, label, to, cta }: { icon: typeof Landmark; label: string; to: string; cta: string }) {
  return (
    <li className="flex flex-col items-center gap-2 py-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm text-muted-foreground">{label}</p>
      <Link to={to} className="text-xs font-medium text-primary hover:underline">
        {cta}
      </Link>
    </li>
  )
}

function AccountsCard() {
  const accounts = useAccountsStore((s) => s.accounts)
  const total = useAccountsStore((s) => s.totalBalance)

  return (
    <Card className="flex flex-col gap-4 p-5">
      <SectionHeader icon={Landmark} label="Contas bancárias" accent="text-emerald-500" />
      <MoneyValue value={total} className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl text-emerald-500" />
      <ul className="-mx-2 flex flex-col border-t pt-1">
        {accounts.length === 0 && <EmptyState icon={Landmark} label="Nenhuma conta ainda" to="/accounts" cta="Adicionar conta" />}
        {accounts.map((a) => (
          <li key={a.id}>
            <Link
              to={`/accounts/${a.id}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
            >
              <AccountAvatar account={a} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{fmtPct(pctOf(a.balance, total))} do total</p>
              </div>
              <MoneyValue
                value={a.balance}
                className={cn("shrink-0 text-sm font-semibold tabular-nums", a.balance > 0 ? "text-emerald-500" : "text-muted-foreground")}
              />
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function CardsCard() {
  const cards = useCardsStore((s) => s.cards)
  const total = useCardsStore((s) => s.grandTotal)
  const limit = cards.reduce((sum, c) => sum + c.creditLimit, 0)
  const used = pctOf(total, limit)

  return (
    <Card className="flex flex-col gap-4 p-5">
      <SectionHeader icon={CreditCard} label="Cartões de crédito" accent="text-red-500" />
      <MoneyValue value={total} className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl text-red-500" />

      {limit > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="tabular-nums">{Math.round(used)}% utilizado</span>
            <span className="tabular-nums">Limite: {formatMoney(limit)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(used, 100)}%` }} />
          </div>
        </div>
      )}

      <ul className="-mx-2 flex flex-col border-t pt-1">
        {cards.length === 0 && <EmptyState icon={CreditCard} label="Nenhum cartão ainda" to="/cards" cta="Adicionar cartão" />}
        {cards.map((c) => (
          <li key={c.id}>
            <Link
              to={`/cards/${c.id}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
            >
              <CardLogo name={c.name} color={c.color} logoUrl={c.logoUrl} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.dueDay ? `Vence dia ${c.dueDay}` : "Fatura do mês"}</p>
              </div>
              <MoneyValue
                value={c.monthlyTotal}
                className={cn("shrink-0 text-sm font-semibold tabular-nums", c.monthlyTotal > 0 ? "text-red-500" : "text-muted-foreground")}
              />
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function InvestmentsCard() {
  const assets = useInvestmentsStore((s) => s.assets)
  const total = useInvestmentsStore((s) => s.totalPatrimony)
  const activeCount = assets.filter((a) => a.active).length
  const inactiveCount = assets.length - activeCount

  return (
    <Card className="flex flex-col gap-4 p-5">
      <SectionHeader icon={TrendingUp} label="Investimentos" accent="text-emerald-500" />
      <div>
        <MoneyValue value={total} className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl text-emerald-500" />
        <p className="mt-1 text-xs text-muted-foreground">
          {assets.length} {assets.length === 1 ? "ativo" : "ativos"} ({activeCount} {activeCount === 1 ? "ativo" : "ativos"} · {inactiveCount} {inactiveCount === 1 ? "inativo" : "inativos"})
        </p>
      </div>
      <ul className="flex flex-col gap-3 border-t pt-3">
        {assets.length === 0 && <EmptyState icon={TrendingUp} label="Nenhum investimento ainda" to="/investments" cta="Adicionar investimento" />}
        {assets.map((a) => (
          <li key={a.id}>
            <Link
              to="/investments"
              className={cn(
                "-mx-2 flex flex-col gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50",
                !a.active && "opacity-50"
              )}
            >
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium">{a.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-muted-foreground tabular-nums">
                  {fmtPct(pctOf(a.currentBalance, total))}
                  <MoneyValue value={a.currentBalance} className="font-semibold text-foreground" />
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(pctOf(a.currentBalance, total), 100)}%` }} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
