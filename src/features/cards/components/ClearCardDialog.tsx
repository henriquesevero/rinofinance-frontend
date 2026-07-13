import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MoneyValue } from "@/components/MoneyValue"
import { toErrorMessage } from "@/lib/errors"
import { currentInstallment } from "../installments"
import { useCardsStore } from "../store"
import type { CardOverview } from "../types"

interface ClearCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: CardOverview
}

// Lets the user bulk-delete a card's items, choosing by group (parceladas
// / avulsas / assinaturas), all at once, or individually. Selection starts
// empty since this is destructive — you opt in to what gets removed.
export function ClearCardDialog({ open, onOpenChange, card }: ClearCardDialogProps) {
  const clearCard = useCardsStore((s) => s.clearCard)
  const [selectedPurchases, setSelectedPurchases] = useState<Set<string>>(new Set())
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set())
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedPurchases(new Set())
      setSelectedSubs(new Set())
    }
  }, [open])

  const parceladas = useMemo(
    () => card.installmentPurchases.filter((p) => p.totalInstallments > 1),
    [card.installmentPurchases]
  )
  const avulsas = useMemo(
    () => card.installmentPurchases.filter((p) => p.totalInstallments === 1),
    [card.installmentPurchases]
  )
  const subscriptions = card.subscriptions

  const totalItems = card.installmentPurchases.length + subscriptions.length
  const selectedCount = selectedPurchases.size + selectedSubs.size

  function togglePurchase(id: string) {
    setSelectedPurchases((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  function toggleSub(id: string) {
    setSelectedSubs((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  function setPurchaseGroup(ids: string[], checked: boolean) {
    setSelectedPurchases((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  }
  function setSubGroup(ids: string[], checked: boolean) {
    setSelectedSubs((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  }
  function setAll(checked: boolean) {
    setSelectedPurchases(new Set(checked ? card.installmentPurchases.map((p) => p.id) : []))
    setSelectedSubs(new Set(checked ? subscriptions.map((s) => s.id) : []))
  }

  async function handleClear() {
    setIsClearing(true)
    try {
      const result = await clearCard(card.id, {
        installmentPurchaseIds: [...selectedPurchases],
        subscriptionIds: [...selectedSubs],
      })
      toast.success(
        `Removido: ${result.installmentPurchases} compra(s) e ${result.subscriptions} assinatura(s)`
      )
      onOpenChange(false)
    } catch (err) {
      toast.error(toErrorMessage(err))
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Limpar dados — {card.name}</DialogTitle>
        </DialogHeader>

        {totalItems === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Este cartão não tem nada para limpar.</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedCount} de {totalItems} selecionados
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
              {parceladas.length > 0 && (
                <Group
                  title="Compras parceladas"
                  total={parceladas.length}
                  checkedCount={parceladas.filter((p) => selectedPurchases.has(p.id)).length}
                  onToggleAll={(c) => setPurchaseGroup(parceladas.map((p) => p.id), c)}
                >
                  {parceladas.map((p) => (
                    <Row key={p.id} checked={selectedPurchases.has(p.id)} onToggle={() => togglePurchase(p.id)}>
                      <span className="truncate" title={p.name}>
                        {p.name}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {currentInstallment(p)}/{p.totalInstallments}
                      </span>
                      <span className="shrink-0 font-medium">
                        <MoneyValue value={p.installmentAmount} />
                      </span>
                    </Row>
                  ))}
                </Group>
              )}

              {avulsas.length > 0 && (
                <Group
                  title="Compras avulsas"
                  total={avulsas.length}
                  checkedCount={avulsas.filter((p) => selectedPurchases.has(p.id)).length}
                  onToggleAll={(c) => setPurchaseGroup(avulsas.map((p) => p.id), c)}
                >
                  {avulsas.map((p) => (
                    <Row key={p.id} checked={selectedPurchases.has(p.id)} onToggle={() => togglePurchase(p.id)}>
                      <span className="truncate" title={p.name}>
                        {p.name}
                      </span>
                      <span className="shrink-0 text-muted-foreground">1x</span>
                      <span className="shrink-0 font-medium">
                        <MoneyValue value={p.installmentAmount} />
                      </span>
                    </Row>
                  ))}
                </Group>
              )}

              {subscriptions.length > 0 && (
                <Group
                  title="Assinaturas"
                  total={subscriptions.length}
                  checkedCount={subscriptions.filter((s) => selectedSubs.has(s.id)).length}
                  onToggleAll={(c) => setSubGroup(subscriptions.map((s) => s.id), c)}
                >
                  {subscriptions.map((s) => (
                    <Row key={s.id} checked={selectedSubs.has(s.id)} onToggle={() => toggleSub(s.id)}>
                      <span className="truncate" title={s.name}>
                        {s.name}
                      </span>
                      <span className="shrink-0 text-muted-foreground">mensal</span>
                      <span className="shrink-0 font-medium">
                        <MoneyValue value={s.monthlyAmount} />
                      </span>
                    </Row>
                  ))}
                </Group>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isClearing}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleClear} disabled={isClearing || selectedCount === 0}>
                {isClearing ? "Removendo..." : `Limpar ${selectedCount} item(ns)`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Group({
  title,
  total,
  checkedCount,
  onToggleAll,
  children,
}: {
  title: string
  total: number
  checkedCount: number
  onToggleAll: (checked: boolean) => void
  children: React.ReactNode
}) {
  const allChecked = checkedCount === total
  const someChecked = checkedCount > 0 && !allChecked
  return (
    <div className="border-b last:border-b-0">
      <label className="sticky top-0 flex cursor-pointer items-center gap-2 bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
        <input
          type="checkbox"
          className="size-3.5 shrink-0"
          checked={allChecked}
          ref={(el) => {
            if (el) el.indeterminate = someChecked
          }}
          onChange={() => onToggleAll(!allChecked)}
        />
        {title} ({checkedCount}/{total})
      </label>
      {children}
    </div>
  )
}

function Row({
  checked,
  onToggle,
  children,
}: {
  checked: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/40">
      <input type="checkbox" className="size-4 shrink-0" checked={checked} onChange={onToggle} />
      <div className="grid flex-1 grid-cols-[1fr_auto_auto] items-center gap-3 overflow-hidden">{children}</div>
    </label>
  )
}
