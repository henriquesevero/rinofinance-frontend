import { formatMoney } from "@/lib/money"
import { useVisibilityStore } from "@/lib/visibility-store"

interface MoneyValueProps {
  value: number
  className?: string
}

export function MoneyValue({ value, className }: MoneyValueProps) {
  const hidden = useVisibilityStore((s) => s.hidden)
  return <span className={className}>{hidden ? "R$ ••••••" : formatMoney(value)}</span>
}
