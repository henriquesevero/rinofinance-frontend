import { Link } from "react-router-dom"
import { MoneyValue } from "@/components/MoneyValue"
import { AccountAvatar } from "./AccountAvatar"
import type { Account } from "../types"

export function AccountTile({ account }: { account: Account }) {
  const color = account.color || "#6B7280"
  return (
    <Link to={`/accounts/${account.id}`} viewTransition className="group block">
      <div
        className="@container relative flex aspect-[1.35] flex-col justify-between overflow-hidden rounded-2xl p-3 shadow-sm ring-1 ring-black/10 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_16px_44px_-16px_rgba(97,218,251,0.5)]"
        style={{ background: `linear-gradient(155deg, ${color} 0%, rgba(0,0,0,0.5) 155%)` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/45 via-black/5 to-transparent"
        />

        <div className="relative flex flex-col gap-1.5">
          <AccountAvatar account={account} className="size-9 rounded-lg ring-1 ring-white/30" />
          <p
            className="truncate text-sm font-semibold leading-tight tracking-wide text-white drop-shadow @[11rem]:text-base"
            title={account.name}
          >
            {account.name}
          </p>
        </div>

        <MoneyValue
          value={account.balance}
          className="relative block truncate text-base font-bold tracking-tight tabular-nums text-white drop-shadow @[11rem]:text-lg"
        />
      </div>
    </Link>
  )
}
