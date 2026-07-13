import { Link } from "react-router-dom"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { AccountAvatar } from "./AccountAvatar"
import type { Account } from "../types"

// One account in the overview grid — a vertical tile like the card tiles
// (logo + name on top, figures below), but using the account's own avatar
// instead of a credit-card artwork. The whole tile links to its detail page.
export function AccountTile({ account }: { account: Account }) {
  return (
    <Link
      to={`/accounts/${account.id}`}
      className="group flex flex-col gap-4 rounded-xl border border-l-4 bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-muted/30"
      style={{ borderLeftColor: account.color || "#6B7280" }}
    >
      <div className="flex items-center gap-3">
        <AccountAvatar account={account} className="size-14" />
        <div className="min-w-0">
          <p className="truncate font-semibold" title={account.name}>
            {account.name}
          </p>
          <p className="text-xs text-muted-foreground">Conta corrente</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted-foreground">Saldo atual</span>
          <MoneyValue
            value={account.balance}
            className={cn(
              "text-lg font-semibold tabular-nums",
              account.balance < 0 && "text-red-600 dark:text-red-400"
            )}
          />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted-foreground">Compras no mês</span>
          <MoneyValue value={account.monthlyDebitTotal} className="tabular-nums" />
        </div>
      </div>
    </Link>
  )
}
