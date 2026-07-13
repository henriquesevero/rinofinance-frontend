import { Landmark } from "lucide-react"
import { useAccountsStore } from "../store"

// Small inline badge showing which account a debit expense was paid from.
// Renders nothing when the expense has no account or it was deleted.
// `dense` renders borderless (icon + name) for a compact meta subline.
export function AccountChip({ accountId, dense }: { accountId?: string; dense?: boolean }) {
  const account = useAccountsStore((s) => s.byId(accountId))
  if (!account) return null

  if (dense) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1">
        <Landmark className="size-3" style={{ color: account.color || "#6B7280" }} />
        {account.name}
      </span>
    )
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
      <Landmark className="size-3" style={{ color: account.color || "#6B7280" }} />
      {account.name}
    </span>
  )
}
