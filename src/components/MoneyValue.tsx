import { formatMoney } from "@/lib/money"
import { useVisibilityStore } from "@/lib/visibility-store"

interface MoneyValueProps {
  value: number
  className?: string
}

// Renders a monetary value, or a masked placeholder when the user has
// toggled values hidden via the eye button — centralized here so every
// call site doesn't need to check the visibility state itself.
export function MoneyValue({ value, className }: MoneyValueProps) {
  const hidden = useVisibilityStore((s) => s.hidden)
  return <span className={className}>{hidden ? "R$ ••••••" : formatMoney(value)}</span>
}
