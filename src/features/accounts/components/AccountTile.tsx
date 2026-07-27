import { Link } from "react-router-dom"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { AccountAvatar } from "./AccountAvatar"
import type { Account } from "../types"

// One account in the overview grid — a compact horizontal card: avatar,
// name and current balance. On hover it lifts and gets a soft white glow.
// Links to the detail page (the whole tile is the CTA).
export function AccountTile({ account }: { account: Account }) {
  return (
    <Link
      to={`/accounts/${account.id}`}
      className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-card to-background p-3 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/60 hover:shadow-[0_12px_36px_-14px_rgba(255,255,255,0.32)]"
    >
      <AccountAvatar account={account} className="size-9 shrink-0 rounded-lg ring-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight" title={account.name}>
          {account.name}
        </p>
        <MoneyValue
          value={account.balance}
          className={cn("text-sm font-bold tracking-tight tabular-nums", account.balance < 0 && "text-red-500")}
        />
      </div>
    </Link>
  )
}
