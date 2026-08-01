import { Link } from "react-router-dom"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { AccountAvatar } from "./AccountAvatar"
import type { Account } from "../types"

// One account in the overview grid — a narrow, compact card: avatar, name
// and current balance stacked. On hover it lifts and gets a soft white glow.
// The whole tile links to the detail page.
export function AccountTile({ account }: { account: Account }) {
  return (
    <Link
      to={`/accounts/${account.id}`}
      viewTransition
      className="group relative flex flex-col gap-2.5 overflow-hidden rounded-xl border border-border/60 bg-card p-3 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_12px_36px_-14px_rgba(97,218,251,0.4)]"
    >
      <AccountAvatar account={account} className="size-8 shrink-0 rounded-lg ring-0" />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold tracking-tight" title={account.name}>
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
