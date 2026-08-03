import { useEffect, useMemo, useState } from "react"
import {
  Check,
  Coins,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoneyValue } from "@/components/MoneyValue"
import { MoneyInput } from "@/components/MoneyInput"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { AssetFormDialog } from "./components/AssetFormDialog"
import { ProventoDialog } from "./components/ProventoDialog"
import { AllocationDonut } from "./components/AllocationDonut"
import { useInvestmentsStore } from "./store"
import { ASSET_CLASSES, classMeta } from "./classes"
import { profit, profitPct, type Asset, type AssetInput } from "./types"

type DialogState = { mode: "create" } | { mode: "edit"; asset: Asset } | null

const round2 = (n: number) => Math.round(n * 100) / 100

function assetToInput(a: Asset): AssetInput {
  return {
    name: a.name,
    ticker: a.ticker,
    class: a.class,
    quantity: a.quantity,
    avgPrice: a.avgPrice,
    currentPrice: a.currentPrice,
    investedAmount: a.investedAmount,
    currentBalance: a.currentBalance,
  }
}

export function InvestmentsPage() {
  const [dialogState, setDialogState] = useState<DialogState>(null)
  const [proventoOpen, setProventoOpen] = useState(false)
  const [proventoAssetId, setProventoAssetId] = useState<string | undefined>(undefined)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState(0)
  const [saving, setSaving] = useState(false)

  const assets = useInvestmentsStore((s) => s.assets)
  const proventos = useInvestmentsStore((s) => s.proventos)
  const totalPatrimony = useInvestmentsStore((s) => s.totalPatrimony)
  const totalInvested = useInvestmentsStore((s) => s.totalInvested)
  const totalProventos = useInvestmentsStore((s) => s.totalProventos)
  const isLoading = useInvestmentsStore((s) => s.isLoading)
  const error = useInvestmentsStore((s) => s.error)
  const fetchAssets = useInvestmentsStore((s) => s.fetchAssets)
  const createAsset = useInvestmentsStore((s) => s.createAsset)
  const updateAsset = useInvestmentsStore((s) => s.updateAsset)
  const toggleAsset = useInvestmentsStore((s) => s.toggleAsset)
  const deleteAsset = useInvestmentsStore((s) => s.deleteAsset)
  const addProvento = useInvestmentsStore((s) => s.addProvento)
  const removeProvento = useInvestmentsStore((s) => s.removeProvento)

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const activeAssets = useMemo(() => assets.filter((a) => a.active), [assets])
  const totalPnl = totalPatrimony - totalInvested
  const totalPnlPct = profitPct(totalPatrimony, totalInvested)
  const yieldOnCost = totalInvested > 0 ? (totalProventos / totalInvested) * 100 : null

  const groups = useMemo(() => {
    return ASSET_CLASSES.map((meta) => {
      const inClass = assets
        .filter((a) => classMeta(a.class).value === meta.value)
        .sort((a, b) => b.currentBalance - a.currentBalance)
      const activeCurrent = inClass.reduce((s, a) => s + (a.active ? a.currentBalance : 0), 0)
      const activeInvested = inClass.reduce((s, a) => s + (a.active ? a.investedAmount : 0), 0)
      return { meta, assets: inClass, activeCurrent, activeInvested }
    }).filter((g) => g.assets.length > 0)
  }, [assets])

  const allocation = useMemo(
    () =>
      groups
        .filter((g) => g.activeCurrent > 0)
        .map((g) => ({ meta: g.meta, value: g.activeCurrent }))
        .sort((a, b) => b.value - a.value),
    [groups]
  )

  const assetById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets])

  async function handleToggle(id: string) {
    try {
      await toggleAsset(id)
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAsset(id)
      toast.success("Ativo removido")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleRemoveProvento(id: string) {
    try {
      await removeProvento(id)
      toast.success("Provento removido")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  function openProvento(assetId?: string) {
    setProventoAssetId(assetId)
    setProventoOpen(true)
  }

  function startEdit(asset: Asset) {
    setDraft(asset.quantity > 0 ? asset.currentPrice : asset.currentBalance)
    setEditingId(asset.id)
  }

  async function saveEdit(asset: Asset) {
    setSaving(true)
    try {
      const input = assetToInput(asset)
      if (asset.quantity > 0) {
        input.currentPrice = draft
        input.currentBalance = round2(asset.quantity * draft)
      } else {
        input.currentBalance = draft
      }
      await updateAsset(asset.id, input)
      toast.success(asset.quantity > 0 ? "Cotação atualizada" : "Valor atualizado")
      setEditingId(null)
    } catch (err) {
      toast.error(toErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (isLoading && assets.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Carregando investimentos...
      </div>
    )
  }

  if (error && assets.length === 0) {
    return <p className="text-center text-destructive">{error}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investimentos</h1>
          <p className="text-muted-foreground">Sua carteira, rentabilidade e proventos.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ValuesVisibilityToggle />
          {assets.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => openProvento()}
              aria-label="Registrar provento"
              title="Registrar provento"
            >
              <Coins className="size-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => setDialogState({ mode: "create" })}
            aria-label="Novo ativo"
            title="Novo ativo"
          >
            <Plus className="size-5" />
          </Button>
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="size-6" />
          </span>
          <p className="text-sm text-muted-foreground">
            Nenhum ativo ainda. Adicione uma ação, FII, renda fixa ou reserva.
          </p>
          <Button variant="outline" size="sm" onClick={() => setDialogState({ mode: "create" })}>
            <Plus className="size-4" />
            Adicionar ativo
          </Button>
        </div>
      ) : (
        <>
          <Card className="gap-0 overflow-hidden p-0">
            <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
              <Cell label="Patrimônio">
                <MoneyValue
                  value={totalPatrimony}
                  className="text-xl font-bold tracking-tight tabular-nums text-emerald-500 sm:text-2xl"
                />
              </Cell>
              <Cell label="Investido">
                <MoneyValue value={totalInvested} className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl" />
              </Cell>
              <Cell label="Rentabilidade" sub={pctLabel(totalPnlPct)}>
                <div className="flex items-center gap-1.5">
                  {totalPnl >= 0 ? (
                    <TrendingUp className="size-4 shrink-0 text-emerald-500" />
                  ) : (
                    <TrendingDown className="size-4 shrink-0 text-rose-500" />
                  )}
                  <MoneyValue
                    value={totalPnl}
                    className={cn(
                      "text-xl font-bold tracking-tight tabular-nums sm:text-2xl",
                      totalPnl >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}
                  />
                </div>
              </Cell>
              <Cell label="Proventos" sub={yieldOnCost !== null ? `yield ${yieldOnCost.toFixed(1)}%` : undefined}>
                <MoneyValue
                  value={totalProventos}
                  className="text-xl font-bold tracking-tight tabular-nums text-emerald-500 sm:text-2xl"
                />
              </Cell>
            </div>
          </Card>

          {allocation.length > 0 && (
            <Card className="flex flex-col gap-5 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 shrink-0 text-emerald-500" />
                <h2 className="text-sm font-semibold">Alocação</h2>
              </div>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
                <AllocationDonut
                  segments={allocation.map((a) => ({ color: a.meta.color, value: a.value }))}
                  total={totalPatrimony}
                />
                <ul className="flex w-full min-w-0 flex-1 flex-col gap-1">
                  {allocation.map((a) => {
                    const share = totalPatrimony > 0 ? (a.value / totalPatrimony) * 100 : 0
                    return (
                      <li key={a.meta.value} className="flex items-center gap-3 py-1">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: a.meta.color }} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.meta.plural}</span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {Math.round(share)}%
                        </span>
                        <MoneyValue value={a.value} className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums" />
                      </li>
                    )
                  })}
                </ul>
              </div>
            </Card>
          )}

          <Card className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Coins className="size-4 shrink-0 text-emerald-500" />
              <h2 className="text-sm font-semibold">Posições</h2>
            </div>

            <div className="flex flex-col gap-5">
              {groups.map((g) => (
                <div key={g.meta.value} className="flex flex-col">
                  <div className="flex items-center gap-2 border-b px-1 pb-1.5">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: g.meta.color }} />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {g.meta.plural}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{g.assets.length}</span>
                    <MoneyValue
                      value={g.activeCurrent}
                      className="ml-auto text-sm font-semibold tabular-nums"
                    />
                  </div>

                  <ul className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
                    {g.assets.map((asset) => {
                      const editing = editingId === asset.id
                      const pnl = profit(asset.currentBalance, asset.investedAmount)
                      const pnlPct = profitPct(asset.currentBalance, asset.investedAmount)
                      const isQuotas = asset.quantity > 0
                      return (
                        <li
                          key={asset.id}
                          className={cn(
                            "group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50",
                            !asset.active && "opacity-60"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-1.5">
                              <p className="min-w-0 truncate text-sm font-semibold" title={asset.name}>
                                {asset.ticker || asset.name}
                              </p>
                              {asset.ticker && (
                                <span className="min-w-0 truncate text-xs text-muted-foreground">{asset.name}</span>
                              )}
                              {!asset.active && (
                                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                  fora
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              {isQuotas ? (
                                <>
                                  <span className="tabular-nums">{formatQty(asset.quantity)} cotas</span>
                                  <span>· PM</span>
                                  <MoneyValue value={asset.avgPrice} className="tabular-nums" />
                                </>
                              ) : (
                                <>
                                  <span>Investido</span>
                                  <MoneyValue value={asset.investedAmount} className="tabular-nums" />
                                </>
                              )}
                            </div>
                          </div>

                          {editing ? (
                            <div className="flex items-center gap-1.5">
                              <MoneyInput
                                value={draft}
                                onValueChange={setDraft}
                                className="h-8 w-24 text-right text-sm font-bold"
                              />
                              <Button
                                size="icon"
                                className="size-7 shrink-0"
                                onClick={() => saveEdit(asset)}
                                disabled={saving}
                                aria-label="Salvar"
                              >
                                <Check className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 shrink-0"
                                onClick={() => setEditingId(null)}
                                disabled={saving}
                                aria-label="Cancelar"
                              >
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(asset)}
                                title={isQuotas ? "Atualizar cotação" : "Atualizar valor"}
                                className="flex flex-col items-end rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted"
                              >
                                <MoneyValue value={asset.currentBalance} className="text-sm font-semibold tabular-nums" />
                                {pnlPct !== null ? (
                                  <span
                                    className={cn(
                                      "text-xs font-medium tabular-nums",
                                      pnl >= 0 ? "text-emerald-500" : "text-rose-500"
                                    )}
                                  >
                                    {pnl >= 0 ? "+" : ""}
                                    {pnlPct.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">tocar p/ editar</span>
                                )}
                              </button>

                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[popup-open]:opacity-100 [@media(hover:none)]:opacity-100"
                                      aria-label="Ações do ativo"
                                      title="Ações"
                                    >
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  }
                                />
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => setDialogState({ mode: "edit", asset })}>
                                    <Pencil className="size-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openProvento(asset.id)}>
                                    <Coins className="size-4" />
                                    Registrar provento
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggle(asset.id)}>
                                    <Power
                                      className={cn(
                                        "size-4",
                                        asset.active ? "text-emerald-500" : "text-muted-foreground/50"
                                      )}
                                    />
                                    {asset.active ? "Tirar do patrimônio" : "Incluir no patrimônio"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(asset.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="size-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          {proventos.length > 0 && (
            <Card className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Coins className="size-4 shrink-0 text-emerald-500" />
                  <h2 className="text-sm font-semibold">Proventos recebidos</h2>
                </div>
                <Button variant="ghost" size="sm" className="h-8" onClick={() => openProvento()}>
                  <Plus className="size-4" />
                  Registrar
                </Button>
              </div>
              <ul className="flex flex-col">
                {proventos.map((p) => {
                  const asset = assetById.get(p.assetId)
                  return (
                    <li
                      key={p.id}
                      className="group flex items-center gap-3 rounded-md px-1 py-2 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {asset ? asset.ticker || asset.name : "Ativo removido"}
                        </p>
                        <span className="text-xs text-muted-foreground">{formatDate(p.date)}</span>
                      </div>
                      <MoneyValue value={p.amount} className="text-sm font-semibold tabular-nums text-emerald-500" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                        aria-label="Remover provento"
                        onClick={() => handleRemoveProvento(p.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </>
      )}

      <AssetFormDialog
        open={dialogState !== null}
        onOpenChange={(open) => !open && setDialogState(null)}
        asset={dialogState?.mode === "edit" ? dialogState.asset : undefined}
        onSubmit={async (input) => {
          if (dialogState?.mode === "edit") {
            await updateAsset(dialogState.asset.id, input)
            toast.success("Ativo atualizado")
          } else {
            await createAsset(input)
            toast.success("Ativo criado")
          }
        }}
      />

      <ProventoDialog
        open={proventoOpen}
        onOpenChange={setProventoOpen}
        defaultAssetId={proventoAssetId}
        assets={activeAssets.length > 0 ? activeAssets : assets}
        onSubmit={async (assetId, amount, date) => {
          await addProvento(assetId, amount, date)
          toast.success("Provento registrado")
        }}
      />
    </div>
  )
}

function pctLabel(pct: number | null): string | undefined {
  if (pct === null) return undefined
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
}

function formatQty(q: number): string {
  return Number.isInteger(q) ? String(q) : q.toLocaleString("pt-BR", { maximumFractionDigits: 8 })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

function Cell({
  label,
  sub,
  children,
}: {
  label: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col justify-center gap-0.5 bg-card p-4 sm:gap-1 sm:p-5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
      {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}
