import { useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatMoney } from "@/lib/money"
import { useAccountsStore } from "../store"

interface AccountSelectProps {
  value: string
  onChange: (accountId: string) => void
  id?: string
}

// Picker for the account a debit purchase is paid from, showing each
// account's color dot and current balance.
export function AccountSelect({ value, onChange, id }: AccountSelectProps) {
  const accounts = useAccountsStore((s) => s.accounts)
  const fetchAccounts = useAccountsStore((s) => s.fetchAccounts)

  useEffect(() => {
    if (accounts.length === 0) fetchAccounts()
  }, [accounts.length, fetchAccounts])

  const selected = accounts.find((a) => a.id === value)

  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger id={id} className="w-full" aria-label="Conta">
        <SelectValue placeholder="Selecione uma conta">
          {() =>
            selected ? (
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: selected.color || "#6B7280" }} />
                {selected.name}
              </span>
            ) : (
              <span className="text-muted-foreground">Selecione uma conta</span>
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            <span className="flex w-full items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: a.color || "#6B7280" }} />
                {a.name}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">{formatMoney(a.balance)}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
