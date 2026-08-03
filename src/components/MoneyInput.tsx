import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatCents(cents: number): string {
  return decimalFormatter.format(cents / 100)
}

export interface MoneyInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: number
  onValueChange: (value: number) => void
}

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
