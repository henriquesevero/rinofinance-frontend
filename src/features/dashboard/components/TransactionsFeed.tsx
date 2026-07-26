import { useEffect, useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Receipt, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoneyValue } from "@/components/MoneyValue"
import { BrandLogo } from "@/features/cards/components/BrandLogo"
import { useAccountsStore } from "@/features/accounts/store"
import { useCardsStore } from "@/features/cards/store"
import { useCategoriesStore } from "@/features/categories/store"
import { cn } from "@/lib/utils"
import { buildFeed, feedSources, groupFeed, type FeedItem } from "../transactionsFeed"
import type { Expense, Income } from "../types"

interface TransactionsFeedProps {
  incomes: Income[]
  expenses: Expense[]
}

type TypeFilter = "all" | "in" | "out"

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

const titleCase = (s: string) =>
  s.replace(/(^|[\s-])([a-zà-ú])/g, (_, sep, ch) => sep + ch.toUpperCase())

function dayHeading(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const wd = new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long" })
  return { day: d, weekday: titleCase(wd) }
}

// A transaction feed: pick a source (account or card) or all,
// filter by type/search, page by month, and see the day-grouped flow.
export function TransactionsFeed({ incomes, expenses }: TransactionsFeedProps) {
  const accounts = useAccountsStore((s) => s.accounts)
  const cards = useCardsStore((s) => s.cards)
  const categories = useCategoriesStore((s) => s.categories)
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)

  const [source, setSource] = useState("all")
  const [type, setType] = useState<TypeFilter>("all")
  const [query, setQuery] = useState("")
  const [viewMonth, setViewMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  useEffect(() => {
    if (accounts.length === 0) fetchAccounts()
  }, [accounts.length, fetchAccounts])

  const sources = useMemo(() => feedSources(accounts, cards), [accounts, cards])
  const catName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])
  const feed = useMemo(() => buildFeed(accounts, cards, incomes, expenses), [accounts, cards, incomes, expenses])

  const now = new Date()
  const isCurrentMonth = viewMonth.getFullYear() === now.getFullYear() && viewMonth.getMonth() === now.getMonth()

  const filtered = useMemo(() => {
    const q = norm(query.trim())
    return feed.filter((it) => {
      if (source !== "all" && it.sourceId !== source) return false
      if (type !== "all" && it.direction !== type) return false
      if (q && !norm(it.name).includes(q)) return false
      if (it.date) {
        const [y, m] = it.date.split("-").map(Number)
        return y === viewMonth.getFullYear() && m - 1 === viewMonth.getMonth()
      }
      return isCurrentMonth // undated recurring items belong to the current month
    })
  }, [feed, source, type, query, viewMonth, isCurrentMonth])

  const totals = useMemo(() => {
    let inSum = 0
    let outSum = 0
    for (const it of filtered) it.direction === "in" ? (inSum += it.amount) : (outSum += it.amount)
    return { inSum, outSum }
  }, [filtered])

  const { days, recurring } = useMemo(() => groupFeed(filtered), [filtered])

  const monthLabel = titleCase(viewMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }))
  const shiftMonth = (delta: number) =>
    setViewMonth((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1))

  return (
    <Card className="flex flex-col gap-4 p-5">
      {/* month nav + totals */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-8" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[9rem] text-center text-sm font-semibold">{monthLabel}</span>
          <Button variant="outline" size="icon" className="size-8" onClick={() => shiftMonth(1)} aria-label="Próximo mês">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold tabular-nums">
          <span className="flex items-center gap-1 text-emerald-500">
            <ArrowDownLeft className="size-4" />
            <MoneyValue value={totals.inSum} />
          </span>
          <span className="flex items-center gap-1 text-rose-500">
            <ArrowUpRight className="size-4" />
            <MoneyValue value={totals.outSum} />
          </span>
        </div>
      </div>

      {/* source + search + type filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={source} onValueChange={(v) => setSource(v ?? "all")}>
          <SelectTrigger size="sm" className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas contas</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.kind === "account" ? "Conta" : "Cartão"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar transação..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-9"
          />
        </div>

        <div className="flex shrink-0 rounded-lg bg-muted p-0.5 text-xs font-medium">
          {(
            [
              ["all", "Todos"],
              ["in", "Entradas"],
              ["out", "Saídas"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setType(v)}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                type === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* feed — fixed height, scrolls internally */}
      {days.length === 0 && recurring.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma transação encontrada.</p>
      ) : (
        <div className="flex max-h-[28rem] flex-col overflow-y-auto">
          {days.map((d) => {
            const h = dayHeading(d.date)
            return (
              <div key={d.date}>
                <div className="sticky top-0 z-10 flex items-baseline gap-2 border-b bg-card py-2">
                  <span className="text-base font-bold tabular-nums">{h.day}</span>
                  <span className="text-xs text-muted-foreground">{h.weekday}</span>
                </div>
                <ul>
                  {d.items.map((it) => (
                    <FeedRow key={it.id} item={it} categoryName={it.categoryId ? catName.get(it.categoryId) : undefined} />
                  ))}
                </ul>
              </div>
            )
          })}

          {recurring.length > 0 && (
            <div>
              <div className="sticky top-0 z-10 flex items-baseline gap-2 border-b bg-card py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recorrentes do mês
                </span>
              </div>
              <ul>
                {recurring.map((it) => (
                  <FeedRow key={it.id} item={it} categoryName={it.categoryId ? catName.get(it.categoryId) : undefined} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function FeedRow({ item, categoryName }: { item: FeedItem; categoryName?: string }) {
  const isIn = item.direction === "in"
  const meta = [item.sourceName, categoryName].filter(Boolean).join(" · ")
  return (
    <li className="flex items-center gap-3 border-b py-3 last:border-b-0">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          isIn ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
        )}
      >
        {isIn ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        {meta && (
          <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <BrandLogo domain={item.domain} fallbackIcon={Receipt} size={32} className="size-3.5 rounded-[3px]" />
            <span className="truncate">{meta}</span>
          </p>
        )}
      </div>
      <MoneyValue
        value={item.amount}
        className={cn("shrink-0 text-sm font-semibold tabular-nums", isIn ? "text-emerald-500" : "text-rose-500")}
      />
    </li>
  )
}
