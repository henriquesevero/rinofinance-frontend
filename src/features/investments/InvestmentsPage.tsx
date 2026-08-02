import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, Pencil, Plus, Trash2, TrendingUp, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { MoneyValue } from "@/components/MoneyValue"
import { MoneyInput } from "@/components/MoneyInput"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { AssetFormDialog } from "./components/AssetFormDialog"
import { AllocationDonut } from "./components/AllocationDonut"
import { useInvestmentsStore } from "./store"
import type { Asset } from "./types"

type DialogState = { mode: "create" } | { mode: "edit"; asset: Asset } | null

// Distinct, calm colors for the allocation arcs/dots — assigned by size order.
const PALETTE = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#f43f5e",
  "#06b6d4", "#a3e635", "#ec4899", "#14b8a6", "#eab308",
]

export function InvestmentsPage() {
  const [dialogState, setDialogState] = useState<DialogState>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState(0)
  const [saving, setSaving] = useState(false)
  const assets = useInvestmentsStore((s) => s.assets)
  const totalPatrimony = useInvestmentsStore((s) => s.totalPatrimony)
  const isLoading = useInvestmentsStore((s) => s.isLoading)
  const error = useInvestmentsStore((s) => s.error)
  const fetchAssets = useInvestmentsStore((s) => s.fetchAssets)
  const createAsset = useInvestmentsStore((s) => s.createAsset)
  const updateAsset = useInvestmentsStore((s) => s.updateAsset)
  const toggleAsset = useInvestmentsStore((s) => s.toggleAsset)
  const deleteAsset = useInvestmentsStore((s) => s.deleteAsset)

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // Active assets (biggest first) make up the patrimony and get a palette
  // color; inactive ones are shown dimmed and excluded from the donut/total.
  const activeAssets = useMemo(
    () => assets.filter((a) => a.active).sort((a, b) => b.currentBalance - a.currentBalance),
    [assets]
  )
  const colorById = useMemo(() => {
    const map = new Map<string, string>()
    activeAssets.forEach((a, i) => map.set(a.id, PALETTE[i % PALETTE.length]))
    return map
  }, [activeAssets])
  const orderedAssets = useMemo(() => [...activeAssets, ...assets.filter((a) => !a.active)], [assets, activeAssets])
  const inactiveCount = assets.length - activeAssets.length
  const biggest = activeAssets[0] ?? null

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

  function startEditBalance(asset: Asset) {
    setDraft(asset.currentBalance)
    setEditingId(asset.id)
  }

  // Quick inline balance edit — the most frequent action as investments grow.
  async function saveBalance(asset: Asset) {
    setSaving(true)
    try {
      await updateAsset(asset.id, asset.name, draft)
      toast.success("Saldo atualizado")
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
          <p className="text-muted-foreground">Seu patrimônio e como ele está distribuído.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ValuesVisibilityToggle />
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
          <p className="text-sm text-muted-foreground">Nenhum ativo ainda. Adicione uma reserva ou investimento.</p>
          <Button variant="outline" size="sm" onClick={() => setDialogState({ mode: "create" })}>
            <Plus className="size-4" />
            Adicionar ativo
          </Button>
        </div>
      ) : (
        <>
          {/* summary strip */}
          <Card className="gap-0 overflow-hidden p-0">
            <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
              <Cell label="Patrimônio total" className="col-span-2 sm:col-span-1">
                <MoneyValue value={totalPatrimony} className="text-xl font-bold tracking-tight tabular-nums text-emerald-500 sm:text-2xl" />
              </Cell>
              <Cell label="Ativos" sub={inactiveCount > 0 ? `${inactiveCount} fora do total` : undefined}>
                <span className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{activeAssets.length}</span>
              </Cell>
              <Cell label="Maior posição" sub={biggest?.name}>
                {biggest ? (
                  <MoneyValue value={biggest.currentBalance} className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl" />
                ) : (
                  <span className="text-xl font-bold text-muted-foreground sm:text-2xl">—</span>
                )}
              </Cell>
            </div>
          </Card>

          {/* portfolio: allocation donut + manageable asset list */}
          <Card className="flex flex-col gap-5 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 shrink-0 text-emerald-500" />
              <h2 className="text-sm font-semibold">Carteira</h2>
            </div>

            <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-8">
              {activeAssets.length > 0 && (
                <AllocationDonut
                  segments={activeAssets.map((a) => ({ color: colorById.get(a.id)!, value: a.currentBalance }))}
                  total={totalPatrimony}
                />
              )}

              <ul className="flex w-full min-w-0 flex-1 flex-col">
                {orderedAssets.map((asset) => {
                  const color = asset.active ? colorById.get(asset.id) ?? "#9ca3af" : "#9ca3af"
                  const share = asset.active && totalPatrimony > 0 ? (asset.currentBalance / totalPatrimony) * 100 : null
                  const editing = editingId === asset.id
                  return (
                    <li
                      key={asset.id}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50",
                        !asset.active && "opacity-55"
                      )}
                    >
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 truncate text-sm font-medium" title={asset.name}>
                            {asset.name}
                          </p>
                          {share !== null && (
                            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{Math.round(share)}%</span>
                          )}
                        </div>
                        {editing ? (
                          <div className="mt-1 flex items-center gap-1.5">
                            <MoneyInput
                              value={draft}
                              onValueChange={setDraft}
                              className="h-8 w-28 text-right text-sm font-bold"
                            />
                            <Button size="icon" className="size-7 shrink-0" onClick={() => saveBalance(asset)} disabled={saving} aria-label="Salvar saldo">
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
                          <button
                            type="button"
                            onClick={() => startEditBalance(asset)}
                            title="Toque para ajustar o saldo"
                            className="group/bal flex items-center gap-1"
                          >
                            <MoneyValue
                              value={asset.currentBalance}
                              className="text-sm font-semibold tabular-nums text-emerald-500"
                            />
                            <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/bal:opacity-100 [@media(hover:none)]:opacity-100" />
                          </button>
                        )}
                      </div>

                      {!editing && (
                        <>
                          <Switch
                            checked={asset.active}
                            onCheckedChange={() => handleToggle(asset.id)}
                            aria-label={asset.active ? "Tirar do patrimônio" : "Incluir no patrimônio"}
                          />
                          <div className="flex shrink-0 items-center sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="Editar ativo"
                              onClick={() => setDialogState({ mode: "edit", asset })}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="Remover ativo"
                              onClick={() => handleDelete(asset.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </Card>
        </>
      )}

      <AssetFormDialog
        open={dialogState !== null}
        onOpenChange={(open) => !open && setDialogState(null)}
        asset={dialogState?.mode === "edit" ? dialogState.asset : undefined}
        onSubmit={async (name, currentBalance) => {
          if (dialogState?.mode === "edit") {
            await updateAsset(dialogState.asset.id, name, currentBalance)
            toast.success("Ativo atualizado")
          } else {
            await createAsset(name, currentBalance)
            toast.success("Ativo criado")
          }
        }}
      />
    </div>
  )
}

function Cell({
  label,
  sub,
  children,
  className,
}: {
  label: string
  sub?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col justify-center gap-0.5 bg-card p-4 sm:gap-1 sm:p-5", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
      {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}
