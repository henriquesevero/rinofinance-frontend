import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Asset } from "../types"

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: Asset
  onSubmit: (name: string, currentBalance: number) => Promise<void>
}

export function AssetFormDialog({ open, onOpenChange, asset, onSubmit }: AssetFormDialogProps) {
  const [name, setName] = useState("")
  const [currentBalance, setCurrentBalance] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(asset?.name ?? "")
      setCurrentBalance(asset ? String(asset.currentBalance) : "")
    }
  }, [open, asset])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(name, Number(currentBalance))
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{asset ? "Editar ativo" : "Novo ativo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="asset-name">Nome da categoria/ativo</Label>
            <Input
              id="asset-name"
              placeholder="Ex: FGTS, Tesouro Direto, Poupança..."
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="asset-balance">Saldo atual</Label>
            <Input
              id="asset-balance"
              type="number"
              step="0.01"
              min="0"
              required
              value={currentBalance}
              onChange={(e) => setCurrentBalance(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
