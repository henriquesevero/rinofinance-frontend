import { useEffect, useRef, useState, type FormEvent } from "react"
import { ImagePlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
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
import { CardArt } from "./CardArt"
import { CARD_BRANDS, CardBrandLogo } from "./CardBrandLogo"
import { resizeImageToDataUrl } from "@/lib/image"
import { toErrorMessage } from "@/lib/errors"
import { toast } from "sonner"
import type { CardInput } from "../types"

const COLOR_PRESETS = [
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
  { label: "Visa", value: "#1A1F71" },
  { label: "Mastercard", value: "#EB001B" },
  { label: "Elo", value: "#FFCB05" },
  { label: "American Express", value: "#2E77BC" },
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
  onDelete?: () => Promise<void> | void
}

export function CardFormDialog({ open, onOpenChange, initial, onSubmit, onDelete }: CardFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [name, setName] = useState(initial?.name ?? "")
  const [color, setColor] = useState(initial?.color || "#6B7280")
  const [brand, setBrand] = useState(initial?.brand ?? "")
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "")
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? "")
  const [creditLimit, setCreditLimit] = useState(initial?.creditLimit ?? 0)
  const [dueDay, setDueDay] = useState(initial?.dueDay ? String(initial.dueDay) : "")
  const [closingDay, setClosingDay] = useState(initial?.closingDay ? String(initial.closingDay) : "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "")
      setColor(initial?.color || "#6B7280")
      setBrand(initial?.brand ?? "")
      setImageUrl(initial?.imageUrl ?? "")
      setLogoUrl(initial?.logoUrl ?? "")
      setCreditLimit(initial?.creditLimit ?? 0)
      setDueDay(initial?.dueDay ? String(initial.dueDay) : "")
      setClosingDay(initial?.closingDay ? String(initial.closingDay) : "")
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

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      setLogoUrl(await resizeImageToDataUrl(file, 512, 1, "image/png"))
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
        brand,
        logoUrl,
        imageUrl,
        creditLimit,
        dueDay: dueDay ? Number(dueDay) : 0,
        closingDay: closingDay ? Number(closingDay) : 0,
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar cartão" : "Novo cartão"}</DialogTitle>
          <DialogDescription>Aparência, limite e datas da fatura.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2.5">
            <div className="relative w-full max-w-[220px]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label={imageUrl ? "Trocar imagem do cartão" : "Adicionar imagem ao cartão"}
                className="block w-full rounded-xl transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <CardArt card={{ name: name || "Cartão", color, imageUrl, logoUrl, brand }} />
              </button>
              <span className="pointer-events-none absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/55 text-white shadow-sm backdrop-blur-sm">
                <ImagePlus className="size-3.5" />
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="font-medium text-primary hover:underline"
              >
                {logoUrl ? "Trocar logo" : "Adicionar logo"}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Remover logo
                </button>
              )}
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Remover imagem
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="card-name">Nome do cartão</Label>
            <Input
              id="card-name"
              placeholder="Ex: Nubank, Inter..."
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
              <Label htmlFor="card-limit">Limite</Label>
              <MoneyInput id="card-limit" value={creditLimit} onValueChange={setCreditLimit} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="card-due">Vencimento</Label>
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="card-closing">Fechamento</Label>
              <Input
                id="card-closing"
                type="number"
                min={1}
                max={31}
                placeholder="8"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Cor do cartão</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => setColor(preset.value)}
                  className="size-6 rounded-full ring-1 ring-foreground/10 ring-offset-2 ring-offset-background data-[selected=true]:ring-2 data-[selected=true]:ring-foreground"
                  data-selected={color.toLowerCase() === preset.value.toLowerCase()}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                aria-label="Escolher cor personalizada"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Bandeira</Label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setBrand("")}
                data-selected={brand === ""}
                className="rounded-full border border-input px-3 py-1 text-xs font-medium text-muted-foreground transition-colors data-[selected=true]:border-foreground data-[selected=true]:text-foreground"
              >
                Nenhuma
              </button>
              {CARD_BRANDS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  title={b.label}
                  aria-label={b.label}
                  onClick={() => setBrand(b.value)}
                  data-selected={brand === b.value}
                  className="rounded-full p-0.5 ring-1 ring-transparent transition-all data-[selected=true]:ring-2 data-[selected=true]:ring-foreground"
                >
                  <CardBrandLogo brand={b.value} className="h-6 w-9" />
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            {initial && onDelete && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto"
                onClick={() => setConfirmDelete(true)}
                disabled={isSubmitting}
              >
                <Trash2 className="size-4" />
                Excluir
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {onDelete && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Excluir cartão?"
          description={
            <>
              <strong className="text-foreground">{name || "Este cartão"}</strong> e todas as suas compras e
              assinaturas serão removidos. Esta ação não pode ser desfeita.
            </>
          }
          confirmLabel="Excluir"
          destructive
          onConfirm={async () => {
            await onDelete()
            onOpenChange(false)
          }}
        />
      )}
    </Dialog>
  )
}
