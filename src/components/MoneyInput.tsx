import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Formats a cents integer as a pt-BR decimal string (no currency symbol),
// e.g. 123456 -> "1.234,56". The "R$" is rendered as a fixed prefix so the
// digits stay right-aligned and the caret behaves like a calculator entry.
function formatCents(cents: number): string {
  return decimalFormatter.format(cents / 100)
}

export interface MoneyInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  /** Amount in reais (e.g. 1234.56). */
  value: number
  /** Called with the new amount in reais. */
  onValueChange: (value: number) => void
}

// A currency-masked text field: the user types digits and they fill in from
// the right as centavos (12 -> R$ 0,12; 1234 -> R$ 12,34), always showing a
// well-formatted BRL value. Emits a plain number (reais) to the parent.
export function MoneyInput({ value, onValueChange, className, ...props }: MoneyInputProps) {
  const cents = Math.round((Number.isFinite(value) ? value : 0) * 100)
  const display = cents > 0 ? formatCents(cents) : ""

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 15)
    onValueChange(digits ? Number(digits) / 100 : 0)
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
        R$
      </span>
      <Input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder="0,00"
        className={cn("pl-9 text-right font-medium tabular-nums", className)}
        {...props}
      />
    </div>
  )
}
