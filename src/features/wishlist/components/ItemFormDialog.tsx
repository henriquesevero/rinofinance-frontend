import { useEffect, useRef, useState, type FormEvent } from "react"
import { ImagePlus, Loader2, Sparkles, ShoppingBag, X } from "lucide-react"
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
import { brandLogoSrc, normalizeDomain } from "@/lib/brandLogo"
import { toErrorMessage } from "@/lib/errors"
import { wishlistApi } from "../api"
import type { ItemInput, WishlistItem, WishlistSection } from "../types"

const NO_SECTION = "__none__"

function parsePrice(raw: string): number {
  const s = raw.replace(/[^\d.,]/g, "")
  if (!s) return 0
  const lastComma = s.lastIndexOf(",")
  const lastDot = s.lastIndexOf(".")
  let normalized = s
  if (lastComma > -1 && lastDot > -1) {
    normalized = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "")
  } else if (lastComma > -1) {
    normalized = s.replace(",", ".")
  }
  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

interface ItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: WishlistItem
  sections: WishlistSection[]
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
  const [isFetching, setIsFetching] = useState(false)
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

  async function handleUnfurl() {
    if (!url.trim()) return
    setIsFetching(true)
    try {
      const meta = await wishlistApi.unfurl(url.trim())
      let filled = false
      let usedLogo = false
      if (meta.imageUrl) {
        setImageUrl(meta.imageUrl)
        filled = true
      } else {
        const logo = brandLogoSrc(normalizeDomain(url.trim()), 256)
        if (logo) {
          setImageUrl(logo)
          filled = true
          usedLogo = true
        }
      }
      if (meta.title && !name.trim()) {
        setName(meta.title)
        filled = true
      }
      if (meta.price && price === 0) {
        const parsed = parsePrice(meta.price)
        if (parsed > 0) {
          setPrice(parsed)
          filled = true
        }
      }
      if (!filled) {
        toast.error("Não encontramos dados nesse link")
      } else if (usedLogo) {
        toast.success("Usamos o logo do site (a imagem do produto não estava disponível)")
      } else {
        toast.success("Dados do produto preenchidos")
      }
    } catch (err) {
      toast.error(toErrorMessage(err))
    } finally {
      setIsFetching(false)
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
        logoUrl: "",
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
          <DialogDescription>Cole o link da loja e busque a imagem e o preço automaticamente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-url">Link da loja</Label>
            <div className="flex gap-2">
              <Input
                id="item-url"
                type="url"
                inputMode="url"
                placeholder="https://..."
                className="flex-1"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleUnfurl} disabled={!url.trim() || isFetching}>
                {isFetching ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Buscar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Preenche imagem, nome e preço a partir da página do produto.</p>
          </div>

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
                {imageUrl ? "Trocar imagem" : "Enviar imagem"}
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
