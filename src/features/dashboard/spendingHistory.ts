import type { CategorySlice } from "./categorySpending"

// Real month-over-month trend for category spending. We snapshot each month's
// per-category totals in localStorage; the donut compares the current month to
// the most recent earlier month to draw ▲/▼ arrows. The very first month has
// no prior data, so no arrows show — the trend is genuine, never faked.

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

// Stores the current month's totals (overwriting the same month) and keeps at
// most the 12 most recent months so the entry can't grow unbounded.
export function recordSnapshot(key: string, slices: CategorySlice[]) {
  const h = read()
  h[key] = Object.fromEntries(slices.map((s) => [s.id, s.total]))
  const keys = Object.keys(h).sort()
  for (const k of keys.slice(0, Math.max(0, keys.length - 12))) delete h[k]
  write(h)
}

// Totals from the most recent month strictly before `key`, or null if none.
export function previousTotals(key: string): Record<string, number> | null {
  const h = read()
  const earlier = Object.keys(h)
    .filter((k) => k < key)
    .sort()
  const prev = earlier.at(-1)
  return prev ? h[prev] : null
}

export type Trend = "up" | "down" | null

// Direction of change for a category vs the previous month. Returns null when
// there's no prior data or the change is negligible (< 2%), to avoid noise.
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
