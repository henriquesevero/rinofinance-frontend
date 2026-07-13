import { useEffect, useRef, useState, type FormEvent } from "react"
import { ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardArt } from "./CardArt"
import { CardLogo } from "./CardLogo"
import { resizeImageToDataUrl } from "@/lib/image"
import { toErrorMessage } from "@/lib/errors"
import { toast } from "sonner"
import type { CardInput } from "../types"

// Common Brazilian card brand colors, as a quick-pick starting point —
// the free color input below still lets the user match any card exactly.
const COLOR_PRESETS = [
  // Bancos digitais
  { label: "Nubank", value: "#8A05BE" },
  { label: "Nubank Ultravioleta", value: "#4B2067" },
  { label: "Inter", value: "#FF7A00" },
  { label: "C6 Bank", value: "#242424" },
  { label: "C6 Carbon", value: "#111111" },
  { label: "PicPay", value: "#21C25E" },
  { label: "Mercado Pago", value: "#009EE3" },
  { label: "Will Bank", value: "#FFD400" },
  { label: "Neon", value: "#00E5B0" },
  { label: "Next", value: "#7ED321" },
  { label: "Banco Original", value: "#7DB61C" },
  { label: "Digio", value: "#0B2A5B" },
  { label: "Ame", value: "#FF0090" },
  // Bancos tradicionais
  { label: "Itaú", value: "#EC7000" },
  { label: "Santander", value: "#EC0000" },
  { label: "Bradesco", value: "#CC092F" },
  { label: "Caixa", value: "#0070AD" },
  { label: "Banco do Brasil", value: "#FAE128" },
  { label: "BTG Pactual", value: "#001E62" },
  { label: "Safra", value: "#00303C" },
  { label: "Sicoob", value: "#00995D" },
  { label: "Sicredi", value: "#3B7C3E" },
  { label: "Banco Pan", value: "#00A9E0" },
  // Bandeiras
  { label: "Visa", value: "#1A1F71" },
  { label: "Mastercard", value: "#EB001B" },
  { label: "Elo", value: "#FFCB05" },
  { label: "American Express", value: "#2E77BC" },
  // Neutros
  { label: "Preto", value: "#111827" },
  { label: "Grafite", value: "#374151" },
  { label: "Neutro", value: "#6B7280" },
  { label: "Prata", value: "#9CA3AF" },
]

interface CardFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: CardInput
  onSubmit: (input: CardInput) => Promise<void>
}

export function CardFormDialog({ open, onOpenChange, initial, onSubmit }: CardFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(initial?.name ?? "")
  const [color, setColor] = useState(initial?.color || "#6B7280")
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "")
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? "")
  const [creditLimit, setCreditLimit] = useState(initial?.creditLimit ? String(initial.creditLimit) : "")
  const [dueDay, setDueDay] = useState(initial?.dueDay ? String(initial.dueDay) : "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "")
      setColor(initial?.color || "#6B7280")
      setImageUrl(initial?.imageUrl ?? "")
      setLogoUrl(initial?.logoUrl ?? "")
      setCreditLimit(initial?.creditLimit ? String(initial.creditLimit) : "")
      setDueDay(initial?.dueDay ? String(initial.dueDay) : "")
    }
  }, [open, initial])

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      // Larger than the avatar-sized logo: this is the full card art shown
      // at ~600px wide in the overview grid.
      setImageUrl(await resizeImageToDataUrl(file, 700, 0.82))
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      setLogoUrl(await resizeImageToDataUrl(file, 256, 0.85))
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        name,
        color,
        logoUrl,
        imageUrl,
        creditLimit: creditLimit ? Number(creditLimit) : 0,
        dueDay: dueDay ? Number(dueDay) : 0,
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar cartão" : "Novo cartão"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Imagem do cartão</Label>
            <div className="mx-auto w-full max-w-[280px]">
              <CardArt card={{ name: name || "Cartão", color, imageUrl }} />
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Logotipo</Label>
            <p className="text-xs text-muted-foreground">Aparece no cartão (no lugar do chip) e nas listas.</p>
            <div className="flex items-center gap-3">
              <CardLogo name={name || "?"} color={color} logoUrl={logoUrl} className="size-12" />
              <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                <ImagePlus className="size-4" />
                {logoUrl ? "Trocar logotipo" : "Enviar logotipo"}
              </Button>
              {logoUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl("")}>
                  <X className="size-4" />
                  Remover
                </Button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="card-name">Nome do cartão</Label>
            <Input
              id="card-name"
              placeholder="Ex: Nubank, Inter..."
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-limit">Limite (R$)</Label>
              <Input
                id="card-limit"
                type="number"
                min={0}
                step="0.01"
                placeholder="5000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="card-due">Dia de vencimento</Label>
              <Input
                id="card-due"
                type="number"
                min={1}
                max={31}
                placeholder="15"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Cor do cartão</Label>
            <p className="text-xs text-muted-foreground">Usada quando não há imagem enviada.</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => setColor(preset.value)}
                  className="size-7 rounded-full ring-1 ring-foreground/10 ring-offset-2 ring-offset-background data-[selected=true]:ring-2 data-[selected=true]:ring-foreground"
                  data-selected={color.toLowerCase() === preset.value.toLowerCase()}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                aria-label="Escolher cor personalizada"
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
