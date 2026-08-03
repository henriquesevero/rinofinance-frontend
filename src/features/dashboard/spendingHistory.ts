import type { CategorySlice } from "./categorySpending"

const STORAGE_KEY = "rinofinance:spend-history"

type History = Record<string, Record<string, number>>

export function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function read(): History {
  if (typeof localStorage === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as History
  } catch {
    return {}
  }
}

function write(h: History) {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h))
}

export function recordSnapshot(key: string, slices: CategorySlice[]) {
  const h = read()
  h[key] = Object.fromEntries(slices.map((s) => [s.id, s.total]))
  const keys = Object.keys(h).sort()
  for (const k of keys.slice(0, Math.max(0, keys.length - 12))) delete h[k]
  write(h)
}

export function previousTotals(key: string): Record<string, number> | null {
  const h = read()
  const earlier = Object.keys(h)
    .filter((k) => k < key)
    .sort()
  const prev = earlier.at(-1)
  return prev ? h[prev] : null
}

export type Trend = "up" | "down" | null

export function trendFor(
  prev: Record<string, number> | null,
  categoryId: string,
  current: number
): Trend {
  if (!prev) return null
  const before = prev[categoryId]
  if (before == null || before === 0) return null
  const change = (current - before) / before
  if (Math.abs(change) < 0.02) return null
  return change > 0 ? "up" : "down"
}
