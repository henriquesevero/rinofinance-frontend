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
import type { SectionInput } from "../types"

interface SectionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName?: string
  onSubmit: (input: SectionInput) => Promise<void>
}

export function SectionFormDialog({ open, onOpenChange, initialName, onSubmit }: SectionFormDialogProps) {
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = initialName !== undefined

  useEffect(() => {
    if (open) setName(initialName ?? "")
  }, [open, initialName])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({ name })
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
          <DialogDescription>Uma categoria da sua lista (ex: Eletrônicos, Roupas).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section-name">Nome da seção</Label>
            <Input
              id="section-name"
              placeholder="Ex: Eletrônicos"
              required
              autoFocus
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
