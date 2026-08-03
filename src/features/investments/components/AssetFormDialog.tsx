import { useEffect, useMemo, useState, type FormEvent } from "react"
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
import { MoneyInput } from "@/components/MoneyInput"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import { ASSET_CLASSES, classMeta } from "../classes"
import type { Asset, AssetInput } from "../types"

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: Asset
  onSubmit: (input: AssetInput) => Promise<void>
}

type Mode = "quotas" | "value"

const round2 = (n: number) => Math.round(n * 100) / 100

export function AssetFormDialog({ open, onOpenChange, asset, onSubmit }: AssetFormDialogProps) {
  const [name, setName] = useState("")
  const [ticker, setTicker] = useState("")
  const [assetClass, setAssetClass] = useState("acao")
  const [mode, setMode] = useState<Mode>("quotas")
  const [quantity, setQuantity] = useState("")
  const [avgPrice, setAvgPrice] = useState(0)
  const [currentPrice, setCurrentPrice] = useState(0)
  const [investedAmount, setInvestedAmount] = useState(0)
  const [currentBalance, setCurrentBalance] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (asset) {
      const startMode: Mode = asset.quantity > 0 ? "quotas" : classMeta(asset.class).defaultMode
      setName(asset.name)
      setTicker(asset.ticker)
      setAssetClass(asset.class)
      setMode(startMode)
      setQuantity(asset.quantity ? String(asset.quantity) : "")
      setAvgPrice(asset.avgPrice)
      setCurrentPrice(asset.currentPrice)
      setInvestedAmount(asset.investedAmount)
      setCurrentBalance(asset.currentBalance)
    } else {
      setName("")
      setTicker("")
      setAssetClass("acao")
      setMode("quotas")
      setQuantity("")
      setAvgPrice(0)
      setCurrentPrice(0)
      setInvestedAmount(0)
      setCurrentBalance(0)
    }
  }, [open, asset])

  function handleClassChange(value: string) {
    setAssetClass(value)
    if (!asset) setMode(classMeta(value).defaultMode)
  }

  const qty = Number(quantity.replace(",", ".")) || 0
  const quotasInvested = useMemo(() => round2(qty * avgPrice), [qty, avgPrice])
  const quotasCurrent = useMemo(() => round2(qty * currentPrice), [qty, currentPrice])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const input: AssetInput =
        mode === "quotas"
          ? {
              name,
              ticker,
              class: assetClass,
              quantity: qty,
              avgPrice,
              currentPrice,
              investedAmount: quotasInvested,
              currentBalance: quotasCurrent,
            }
          : {
              name,
              ticker,
              class: assetClass,
              quantity: 0,
              avgPrice: 0,
              currentPrice: 0,
              investedAmount,
              currentBalance,
            }
      await onSubmit(input)
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
          <DialogDescription>
            Uma posição da sua carteira — ação, FII, renda fixa, cripto ou reserva.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="asset-class">Classe</Label>
              <Select value={assetClass} onValueChange={(v) => handleClassChange(v ?? "outro")}>
                <SelectTrigger id="asset-class" className="w-full">
                  <SelectValue>{classMeta(assetClass).label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CLASSES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="asset-ticker">Ticker / código</Label>
              <Input
                id="asset-ticker"
                placeholder="PETR4, HGLG11…"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="uppercase"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-name">Nome</Label>
            <Input
              id="asset-name"
              placeholder="Ex: Petrobras, CSHG Logística, Tesouro IPCA…"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
            <ModeButton active={mode === "quotas"} onClick={() => setMode("quotas")}>
              Por cotas
            </ModeButton>
            <ModeButton active={mode === "value"} onClick={() => setMode("value")}>
              Por valor
            </ModeButton>
          </div>

          {mode === "quotas" ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="asset-qty">Quantidade</Label>
                  <Input
                    id="asset-qty"
                    inputMode="decimal"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="asset-avg">Preço médio</Label>
                  <MoneyInput id="asset-avg" value={avgPrice} onValueChange={setAvgPrice} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="asset-cur">Preço atual</Label>
                  <MoneyInput id="asset-cur" value={currentPrice} onValueChange={setCurrentPrice} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border text-center">
                <Preview label="Investido" value={quotasInvested} />
                <Preview label="Valor atual" value={quotasCurrent} accent />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="asset-invested">Valor investido</Label>
                <MoneyInput id="asset-invested" value={investedAmount} onValueChange={setInvestedAmount} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="asset-balance">Valor atual</Label>
                <MoneyInput
                  id="asset-balance"
                  required
                  value={currentBalance}
                  onValueChange={setCurrentBalance}
                />
              </div>
            </div>
          )}

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

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md py-1.5 font-medium transition-colors",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function Preview({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 bg-card px-3 py-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <MoneyValue
        value={value}
        className={cn("text-base font-bold tabular-nums", accent && "text-emerald-500")}
      />
    </div>
  )
}
