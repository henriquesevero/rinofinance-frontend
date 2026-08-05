import { useEffect, useRef, useState, type FormEvent } from "react"
import { ImagePlus, X } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { resizeImageToDataUrl } from "@/lib/image"
import { toErrorMessage } from "@/lib/errors"
import type { ItemInput, WishlistItem, WishlistSection } from "@/features/wishlist/types"
import { SiteLogo } from "./SiteLogo"

const NO_SECTION = "__none__"

function withScheme(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ""
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

interface AccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: WishlistItem
  sections: WishlistSection[]
  defaultSectionId?: string
  onSubmit: (input: ItemInput) => Promise<void>
}

export function AccountFormDialog({ open, onOpenChange, account, sections, defaultSectionId, onSubmit }: AccountFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [sectionId, setSectionId] = useState(NO_SECTION)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = Boolean(account)

  useEffect(() => {
    if (!open) return
    setName(account?.name ?? "")
    setUrl(account?.url ?? "")
    setLogoUrl(account?.logoUrl ?? "")
    setImageUrl(account?.imageUrl ?? "")
    setSectionId(account?.sectionId ?? defaultSectionId ?? NO_SECTION)
  }, [open, account, defaultSectionId])

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      setImageUrl(await resizeImageToDataUrl(file, 512, 1, "image/png"))
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
        url: withScheme(url),
        price: 0,
        imageUrl,
        logoUrl: logoUrl.trim(),
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
          <DialogTitle>{isEdit ? "Editar conta" : "Nova conta"}</DialogTitle>
          <DialogDescription>O logo vem do site informado, ou envie o seu.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-card">
              <SiteLogo name={name || "?"} url={url} logoUrl={logoUrl} imageUrl={imageUrl} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="size-4" />
                {imageUrl ? "Trocar logo" : "Enviar logo"}
              </Button>
              {imageUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl("")}>
                  <X className="size-4" />
                  Usar logo automático
                </Button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-url">Endereço de login</Label>
            <Input
              id="account-url"
              type="text"
              inputMode="url"
              required
              placeholder="magazineluiza.com.br/login"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Abre este endereço ao tocar na conta.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-logo">Site do logo (opcional)</Label>
            <Input
              id="account-logo"
              type="text"
              inputMode="url"
              placeholder="magazineluiza.com.br"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Usado só para buscar o logotipo. Se vazio, tenta pelo endereço de login.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-name">Nome</Label>
            <Input
              id="account-name"
              required
              placeholder="Ex: Magazine Luiza, Google, Nubank…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-section">Seção</Label>
            <Select value={sectionId} onValueChange={(v) => setSectionId(v ?? NO_SECTION)}>
              <SelectTrigger id="account-section" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    value && value !== NO_SECTION ? sections.find((s) => s.id === value)?.name ?? "Sem seção" : "Sem seção"
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
