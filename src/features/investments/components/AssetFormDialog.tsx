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
import { MoneyInput } from "@/components/MoneyInput"
import type { Asset } from "../types"

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: Asset
  onSubmit: (name: string, currentBalance: number) => Promise<void>
}

export function AssetFormDialog({ open, onOpenChange, asset, onSubmit }: AssetFormDialogProps) {
  const [name, setName] = useState("")
  const [currentBalance, setCurrentBalance] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(asset?.name ?? "")
      setCurrentBalance(asset?.currentBalance ?? 0)
    }
  }, [open, asset])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(name, currentBalance)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{asset ? "Editar ativo" : "Novo ativo"}</DialogTitle>
          <DialogDescription>Uma reserva ou investimento que você acompanha (ex: FGTS, Tesouro).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-balance">Saldo atual</Label>
            <MoneyInput
              id="asset-balance"
              required
              value={currentBalance}
              onValueChange={setCurrentBalance}
              className="h-11 text-lg"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-name">Nome da categoria/ativo</Label>
            <Input
              id="asset-name"
              placeholder="Ex: FGTS, Tesouro Direto, Poupança..."
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
