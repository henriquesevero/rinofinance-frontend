import { useEffect, useRef, useState, type FormEvent } from "react"
import { ImagePlus, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resizeImageToDataUrl } from "@/lib/image"
import { toErrorMessage } from "@/lib/errors"
import { COLOR_PRESETS } from "@/lib/colorPresets"
import { AccountAvatar } from "./AccountAvatar"
import type { AccountInput } from "../types"

interface AccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: AccountInput
  onSubmit: (input: AccountInput) => Promise<void>
}

export function AccountFormDialog({ open, onOpenChange, initial, onSubmit }: AccountFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState("")
  const [color, setColor] = useState(COLOR_PRESETS[0])
  const [imageUrl, setImageUrl] = useState("")
  const [balance, setBalance] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "")
      setColor(initial?.color || COLOR_PRESETS[0])
      setImageUrl(initial?.imageUrl ?? "")
      setBalance(initial ? String(initial.balance) : "")
    }
  }, [open, initial])

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      setImageUrl(await resizeImageToDataUrl(file, 700, 0.82))
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({ name, color, imageUrl, balance: balance ? Number(balance) : 0 })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar conta" : "Nova conta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Imagem da conta</Label>
            <div className="flex justify-center">
              <AccountAvatar account={{ name: name || "Conta", color, imageUrl }} className="size-24" />
            </div>
            <div className="flex justify-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="size-4" />
                {imageUrl ? "Trocar imagem" : "Enviar imagem"}
              </Button>
              {imageUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl("")}>
                  <X className="size-4" />
                  Remover
                </Button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="account-name">Nome</Label>
            <Input
              id="account-name"
              placeholder="Ex: Nubank, Carteira..."
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-balance">Saldo atual</Label>
            <Input
              id="account-balance"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Cor</Label>
            <p className="text-xs text-muted-foreground">Usada quando não há imagem enviada.</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className="size-7 rounded-full ring-1 ring-foreground/10 ring-offset-2 ring-offset-background data-[selected=true]:ring-2 data-[selected=true]:ring-foreground"
                  data-selected={color.toLowerCase() === preset.toLowerCase()}
                  style={{ backgroundColor: preset }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                aria-label="Cor personalizada"
              />
            </div>
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
