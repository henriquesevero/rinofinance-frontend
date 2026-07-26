import type { Account } from "@/features/accounts/types"
import type { CardOverview } from "@/features/cards/types"
import { logoDomain } from "@/features/cards/fatura/brands"
import { bankDomain } from "@/lib/brandLogo"
import type { Expense, Income } from "./types"

export interface FeedSource {
  id: string
  name: string
  kind: "account" | "card"
}

export interface FeedItem {
  id: string
  name: string
  amount: number
  // YYYY-MM-DD for a real transaction, or null for undated monthly items
  // (subscriptions, recurring income/expenses).
  date: string | null
  direction: "in" | "out"
  sourceId: string
  sourceName: string
  categoryId?: string
  domain: string
  recurring: boolean
}

// The list of pickable sources (accounts + cards) for the feed's selector.
export function feedSources(accounts: Account[], cards: CardOverview[]): FeedSource[] {
  return [
    ...accounts.map((a) => ({ id: a.id, name: a.name, kind: "account" as const })),
    ...cards.map((c) => ({ id: c.id, name: c.name, kind: "card" as const })),
  ]
}

// Flattens everything into a single transaction feed: card purchases and debit
// purchases are dated; subscriptions and recurring income/expenses are undated
// monthly items. Card- and account-linked expenses are skipped because their
// value already mirrors the card/account items, which we count directly.
export function buildFeed(
  accounts: Account[],
  cards: CardOverview[],
  incomes: Income[],
  expenses: Expense[]
): FeedItem[] {
  const items: FeedItem[] = []

  for (const card of cards) {
    for (const p of card.installmentPurchases) {
      items.push({
        id: `ip-${p.id}`,
        name: p.name,
        amount: p.installmentAmount,
        date: (p.firstInstallmentDate || "").slice(0, 10) || null,
        direction: "out",
        sourceId: card.id,
        sourceName: card.name,
        categoryId: p.categoryId,
        domain: logoDomain(p.name, p.domain),
        recurring: false,
      })
    }
    for (const s of card.subscriptions) {
      items.push({
        id: `sub-${s.id}`,
        name: s.name,
        amount: s.monthlyAmount,
        date: null,
        direction: "out",
        sourceId: card.id,
        sourceName: card.name,
        categoryId: s.categoryId,
        domain: logoDomain(s.name, s.domain),
        recurring: true,
      })
    }
  }

  for (const account of accounts) {
    for (const p of account.purchases) {
      items.push({
        id: `ap-${p.id}`,
        name: p.name,
        amount: p.amount,
        date: (p.date || "").slice(0, 10) || null,
        direction: p.direction === "credit" ? "in" : "out",
        sourceId: account.id,
        sourceName: account.name,
        categoryId: p.categoryId,
        domain: logoDomain(p.name),
        recurring: false,
      })
    }
  }

  const accountName = new Map(accounts.map((a) => [a.id, a.name]))
  for (const i of incomes) {
    if (!i.active) continue
    items.push({
      id: `inc-${i.id}`,
      name: i.name,
      amount: i.amount,
      date: null,
      direction: "in",
      sourceId: i.accountId ?? "",
      sourceName: i.accountId ? accountName.get(i.accountId) ?? "" : "",
      categoryId: i.categoryId,
      domain: logoDomain(i.name),
      recurring: true,
    })
  }

  // Standalone expenses only (card/account-linked ones would double-count).
  for (const e of expenses) {
    if (!e.active || e.cardId || e.accountId) continue
    items.push({
      id: `exp-${e.id}`,
      name: e.name,
      amount: e.amount,
      date: null,
      direction: "out",
      sourceId: "",
      sourceName: "",
      categoryId: e.categoryId,
      domain: logoDomain(e.name),
      recurring: true,
    })
  }

  return items
}

// Groups dated items by day (newest first); undated recurring items are
// collected separately so the caller can render them under a "monthly" header.
export interface FeedDay {
  date: string
  items: FeedItem[]
}

export function groupFeed(items: FeedItem[]): { days: FeedDay[]; recurring: FeedItem[] } {
  const byDay = new Map<string, FeedItem[]>()
  const recurring: FeedItem[] = []
  for (const it of items) {
    if (it.date) {
      const arr = byDay.get(it.date) ?? []
      arr.push(it)
      byDay.set(it.date, arr)
    } else {
      recurring.push(it)
    }
  }
  const days: FeedDay[] = [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, dayItems]) => ({ date, items: dayItems.sort((a, b) => b.amount - a.amount) }))
  return { days, recurring }
}

// `bankDomain` is re-exported so the feed's source selector can show logos
// without importing from two modules.
export { bankDomain }
