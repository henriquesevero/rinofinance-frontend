import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { COLOR_PRESETS } from "@/lib/colorPresets"
import { CATEGORY_ICONS, CategoryIcon } from "../categoryIcons"
import type { CategoryInput } from "../types"

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: CategoryInput
  onSubmit: (input: CategoryInput) => Promise<void>
}

export function CategoryFormDialog({ open, onOpenChange, initial, onSubmit }: CategoryFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [color, setColor] = useState(initial?.color || COLOR_PRESETS[0])
  const [icon, setIcon] = useState(initial?.icon ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "")
      setColor(initial?.color || COLOR_PRESETS[0])
      setIcon(initial?.icon ?? "")
    }
  }, [open, initial])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({ name, color, icon })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}22` }}
            >
              <CategoryIcon name={icon} className="size-5" style={{ color }} />
            </span>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="category-name">Nome</Label>
              <Input
                id="category-name"
                placeholder="Ex: Alimentação"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Cor</Label>
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

          <div className="flex flex-col gap-2">
            <Label>Ícone</Label>
            <div className="grid grid-cols-9 gap-1.5">
              {CATEGORY_ICONS.map(({ name: iconName, Icon }) => {
                const isSelected = icon === iconName
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    aria-label={iconName}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md border transition-colors",
                      isSelected ? "border-foreground bg-muted" : "hover:bg-muted/50"
                    )}
                    style={isSelected ? { color } : undefined}
                  >
                    <Icon className="size-4" />
                  </button>
                )
              })}
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
