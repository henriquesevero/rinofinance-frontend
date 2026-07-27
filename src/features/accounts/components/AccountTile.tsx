import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { AccountAvatar } from "./AccountAvatar"
import type { Account } from "../types"

// One account in the overview grid — mirrors the card tile: identity header
// (avatar + name + active dot), the current balance in the spotlight, the
// month's debits as a secondary figure, and a "Ver detalhes" CTA. On hover it
// lifts, zooms slightly and gets a soft white glow. Links to the detail page.
export function AccountTile({ account }: { account: Account }) {
  return (
    <Link
      to={`/accounts/${account.id}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-card to-background p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-white/60 hover:shadow-[0_16px_50px_-16px_rgba(255,255,255,0.35)]"
    >
      <div className="flex items-center gap-2.5">
        <AccountAvatar account={account} className="size-9 shrink-0 rounded-lg ring-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight" title={account.name}>
            {account.name}
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_1px] shadow-emerald-500/50" />
            Conta ativa
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Saldo atual</p>
          <MoneyValue
            value={account.balance}
            className={cn("text-lg font-bold tracking-tight tabular-nums", account.balance < 0 && "text-red-500")}
          />
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">No mês</p>
          <MoneyValue value={account.monthlyDebitTotal} className="text-xs font-medium tabular-nums" />
        </div>
      </div>

      <div className="mt-auto border-t border-border/60 pt-2.5">
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
          Ver detalhes
          <ChevronRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
