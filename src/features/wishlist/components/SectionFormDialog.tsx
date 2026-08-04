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
import { COLOR_PRESETS } from "@/lib/colorPresets"
import type { SectionInput } from "../types"

interface SectionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName?: string
  initialColor?: string
  onSubmit: (input: SectionInput) => Promise<void>
}

export function SectionFormDialog({ open, onOpenChange, initialName, initialColor, onSubmit }: SectionFormDialogProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(COLOR_PRESETS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = initialName !== undefined

  useEffect(() => {
    if (open) {
      setName(initialName ?? "")
      setColor(initialColor || COLOR_PRESETS[0])
    }
  }, [open, initialName, initialColor])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({ name, color })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar seção" : "Nova seção"}</DialogTitle>
          <DialogDescription>Um grupo com nome e cor à sua escolha.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section-name">Nome da seção</Label>
            <Input
              id="section-name"
              placeholder="Ex: Bancos, Compras, Streaming"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ color }}
              className="font-semibold"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Cor do texto</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className="size-7 rounded-full ring-1 ring-foreground/10 ring-offset-2 ring-offset-background data-[selected=true]:ring-2 data-[selected=true]:ring-foreground"
                  data-selected={color.toLowerCase() === preset.toLowerCase()}
                  style={{ backgroundColor: preset }}
                  aria-label={`Cor ${preset}`}
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
