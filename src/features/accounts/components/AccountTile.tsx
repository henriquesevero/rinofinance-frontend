import { Link } from "react-router-dom"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { AccountAvatar } from "./AccountAvatar"
import type { Account } from "../types"

// One account in the overview grid. Same craft as the cards grid — a rounded,
// frameless tile that lifts and gets a blue glow on hover — but a distinct
// shape (squarer, not credit-card proportions) and a softer look: the account
// color is a gentle tint on the surface (so the full-color avatar still pops),
// with the name and balance stacked at the bottom. The whole tile links to the
// account's detail page.
export function AccountTile({ account }: { account: Account }) {
  const color = account.color || "#6B7280"
  return (
    <Link to={`/accounts/${account.id}`} viewTransition className="group block">
      <div
        className="relative flex aspect-[1.3] flex-col justify-between overflow-hidden rounded-2xl border border-border/60 p-3.5 shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-[0_16px_44px_-16px_rgba(97,218,251,0.45)]"
        style={{ background: `linear-gradient(155deg, color-mix(in oklab, ${color} 16%, var(--card)) 0%, var(--card) 68%)` }}
      >
        <AccountAvatar account={account} className="size-10 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground" title={account.name}>
            {account.name}
          </p>
          <MoneyValue
            value={account.balance}
            className={cn(
              "block truncate text-lg font-bold tracking-tight tabular-nums",
              account.balance < 0 ? "text-red-500" : "text-foreground"
            )}
          />
        </div>
      </div>
    </Link>
  )
}
