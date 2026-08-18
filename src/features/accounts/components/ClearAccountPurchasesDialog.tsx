import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MoneyValue } from "@/components/MoneyValue"
import { toErrorMessage } from "@/lib/errors"
import { useAccountsStore } from "../store"
import type { Account } from "../types"

interface ClearAccountPurchasesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: Account
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })

function toggleInSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

export function ClearAccountPurchasesDialog({ open, onOpenChange, account }: ClearAccountPurchasesDialogProps) {
  const deletePurchase = useAccountsStore((s) => s.deletePurchase)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    if (open) setSelected(new Set())
  }, [open])

  const purchases = account.purchases
  const allChecked = purchases.length > 0 && selected.size === purchases.length
  const someChecked = selected.size > 0 && !allChecked

  function setAll(checked: boolean) {
    setSelected(new Set(checked ? purchases.map((p) => p.id) : []))
  }

  async function handleClear() {
    setIsClearing(true)
    try {
      const ids = [...selected]
      await Promise.all(ids.map((id) => deletePurchase(id)))
      toast.success(`${ids.length} compra(s) removida(s)`)
      onOpenChange(false)
    } catch (err) {
      toast.error(toErrorMessage(err))
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Limpar compras no débito — {account.name}</DialogTitle>
        </DialogHeader>

        {purchases.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma compra lançada neste mês.</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selected.size} de {purchases.length} selecionadas
              </span>
              <div className="flex gap-3">
                <button type="button" className="underline underline-offset-4" onClick={() => setAll(true)}>
                  Selecionar tudo
                </button>
                <button type="button" className="underline underline-offset-4" onClick={() => setAll(false)}>
                  Limpar seleção
                </button>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto rounded-lg border">
              <div className="sticky top-0 z-10 flex items-center gap-2 bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                <input
                  type="checkbox"
                  className="size-3.5 shrink-0 cursor-pointer"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked
                  }}
                  onChange={() => setAll(!allChecked)}
                  aria-label="Selecionar todas as compras"
                />
                <span>
                  Compras no débito ({selected.size}/{purchases.length})
                </span>
              </div>
              {purchases.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-3 border-t px-3 py-2 text-sm hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    className="size-4 shrink-0"
                    checked={selected.has(p.id)}
                    onChange={() => setSelected((prev) => toggleInSet(prev, p.id))}
                  />
                  <div className="grid flex-1 grid-cols-[1fr_auto_auto] items-center gap-3 overflow-hidden">
                    <span className="truncate" title={p.name}>
                      {p.name}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {dateFormatter.format(new Date(`${p.date}T00:00:00`))}
                    </span>
                    <span className="shrink-0 font-medium">
                      <MoneyValue value={p.amount} />
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isClearing}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleClear} disabled={isClearing || selected.size === 0}>
                {isClearing ? "Removendo..." : `Excluir ${selected.size} compra(s)`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
