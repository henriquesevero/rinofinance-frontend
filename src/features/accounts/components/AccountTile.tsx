import { Link } from "react-router-dom"
import { ChevronRight, Clock } from "lucide-react"
import { AccountAvatar } from "./AccountAvatar"
import type { Account } from "../types"

// One account rendered as a "connection" card: brand logo, an
// active status dot, the name and last-sync line, then a "Ver detalhes" CTA.
// On hover the border glows, the whole card lifts and zooms ever so slightly,
// and the CTA turns blue — all animated. The card links to the detail page.
export function AccountTile({ account }: { account: Account }) {
  return (
    <Link
      to={`/accounts/${account.id}`}
      className="group relative flex min-h-[13rem] flex-col overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-background p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-white/60 hover:shadow-[0_16px_50px_-16px_rgba(255,255,255,0.35)]"
    >
      {/* active status dot */}
      <span className="absolute right-5 top-5 size-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_2px] shadow-emerald-500/50" />

      <AccountAvatar account={account} className="size-12 rounded-xl ring-0" />

      <div className="mt-6">
        <p className="truncate text-xl font-bold tracking-tight" title={account.name}>
          {account.name}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-3.5" />
          Hoje
        </p>
      </div>

      <div className="mt-auto border-t border-border/60 pt-4">
        <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
          Ver detalhes
          <ChevronRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
