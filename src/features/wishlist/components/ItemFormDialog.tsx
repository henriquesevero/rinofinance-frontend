import { useEffect, useRef, useState, type FormEvent } from "react"
import { ImagePlus, ShoppingBag, X } from "lucide-react"
import { toast } from "sonner"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { resizeImageToDataUrl } from "@/lib/image"
import { toErrorMessage } from "@/lib/errors"
import type { ItemInput, WishlistItem, WishlistSection } from "../types"

const NO_SECTION = "__none__"

interface ItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: WishlistItem
  sections: WishlistSection[]
  // Pre-selected section when adding from a section's "+".
  defaultSectionId?: string
  onSubmit: (input: ItemInput) => Promise<void>
}

export function ItemFormDialog({ open, onOpenChange, item, sections, defaultSectionId, onSubmit }: ItemFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [price, setPrice] = useState(0)
  const [imageUrl, setImageUrl] = useState("")
  const [sectionId, setSectionId] = useState(NO_SECTION)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = Boolean(item)

  useEffect(() => {
    if (open) {
      setName(item?.name ?? "")
      setUrl(item?.url ?? "")
      setPrice(item?.price ?? 0)
      setImageUrl(item?.imageUrl ?? "")
      setSectionId(item?.sectionId ?? defaultSectionId ?? NO_SECTION)
    }
  }, [open, item, defaultSectionId])

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      setImageUrl(await resizeImageToDataUrl(file, 600, 0.82))
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
        url,
        price,
        imageUrl,
        sectionId: sectionId === NO_SECTION ? "" : sectionId,
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
          <DialogTitle>{isEdit ? "Editar item" : "Novo item"}</DialogTitle>
          <DialogDescription>Um produto que você quer comprar — com link, valor e imagem.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <ShoppingBag className="size-7 text-muted-foreground" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="size-4" />
                {imageUrl ? "Trocar imagem" : "Adicionar imagem"}
              </Button>
              {imageUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl("")}>
                  <X className="size-4" />
                  Remover imagem
                </Button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-name">Nome do produto</Label>
            <Input
              id="item-name"
              placeholder="Ex: iPhone 16 Pro"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-price">Valor</Label>
              <MoneyInput id="item-price" value={price} onValueChange={setPrice} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-section">Seção</Label>
              <Select value={sectionId} onValueChange={(v) => setSectionId(v ?? NO_SECTION)}>
                <SelectTrigger id="item-section" className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      value && value !== NO_SECTION
                        ? sections.find((s) => s.id === value)?.name ?? "Sem seção"
                        : "Sem seção"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SECTION}>Sem seção</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-url">Link da loja</Label>
            <Input
              id="item-url"
              type="url"
              inputMode="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
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
