import { Link } from "react-router-dom"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { AccountAvatar } from "./AccountAvatar"
import type { Account } from "../types"

export function AccountTile({ account, className }: { account: Account; className?: string }) {
  const color = account.color || "#6B7280"
  return (
    <Link to={`/accounts/${account.id}`} viewTransition className="group block">
      <div
        className={cn(
          "@container relative flex aspect-[1.45] flex-col justify-between overflow-hidden rounded-2xl p-3 shadow-sm ring-1 ring-black/10 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_16px_44px_-16px_rgba(97,218,251,0.5)]",
          className
        )}
        style={{ background: `linear-gradient(155deg, ${color} 0%, rgba(0,0,0,0.5) 155%)` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/45 via-black/5 to-transparent"
        />

        {/* Desktop: icon + name stacked at top, balance at bottom */}
        <div className="relative hidden flex-col gap-1.5 md:flex">
          <AccountAvatar account={account} className="size-9 rounded-lg ring-0" />
          <p
            className="truncate text-sm font-semibold leading-tight tracking-wide text-white drop-shadow @[11rem]:text-base"
            title={account.name}
          >
            {account.name}
          </p>
        </div>
        <MoneyValue
          value={account.balance}
          className="relative hidden truncate text-base font-bold tracking-tight tabular-nums text-white drop-shadow @[11rem]:text-lg md:block"
        />

        {/* Mobile: name at top, icon centered, no balance shown on the card itself */}
        <p
          className="relative truncate text-sm font-semibold leading-tight tracking-wide text-white drop-shadow md:hidden"
          title={account.name}
        >
          {account.name}
        </p>
        <div className="absolute inset-0 flex items-center justify-center md:hidden">
          <AccountAvatar account={account} className="size-20 rounded-xl ring-0" />
        </div>
      </div>
    </Link>
  )
}
