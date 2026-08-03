import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoneyInput } from "@/components/MoneyInput"
import type { Asset } from "../types"

interface ProventoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets: Asset[]
  defaultAssetId?: string
  onSubmit: (assetId: string, amount: number, date: string) => Promise<void>
}

const todayISO = () => new Date().toISOString().slice(0, 10)

export function ProventoDialog({ open, onOpenChange, assets, defaultAssetId, onSubmit }: ProventoDialogProps) {
  const [assetId, setAssetId] = useState("")
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayISO())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setAssetId(defaultAssetId ?? assets[0]?.id ?? "")
    setAmount(0)
    setDate(todayISO())
  }, [open, defaultAssetId, assets])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!assetId) return
    setIsSubmitting(true)
    try {
      await onSubmit(assetId, amount, new Date(`${date}T12:00:00`).toISOString())
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selected = assets.find((a) => a.id === assetId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar provento</DialogTitle>
          <DialogDescription>Dividendos, JCP ou rendimentos recebidos de um ativo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="provento-asset">Ativo</Label>
            <Select value={assetId} onValueChange={(v) => setAssetId(v ?? "")}>
              <SelectTrigger id="provento-asset" className="w-full">
                <SelectValue placeholder="Selecione um ativo">
                  {selected ? (selected.ticker || selected.name) : ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.ticker ? `${a.ticker} · ${a.name}` : a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="provento-amount">Valor</Label>
              <MoneyInput id="provento-amount" required value={amount} onValueChange={setAmount} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="provento-date">Data</Label>
              <Input
                id="provento-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !assetId}>
              {isSubmitting ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
