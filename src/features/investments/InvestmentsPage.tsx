import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { MoneyValue } from "@/components/MoneyValue"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { AssetFormDialog } from "./components/AssetFormDialog"
import { useInvestmentsStore } from "./store"
import type { Asset } from "./types"

type DialogState = { mode: "create" } | { mode: "edit"; asset: Asset } | null

export function InvestmentsPage() {
  const [dialogState, setDialogState] = useState<DialogState>(null)
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
          <p className="text-muted-foreground">Acompanhe seu patrimônio e reservas.</p>
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

      {/* patrimônio total — compacto e discreto */}
      <Card className="flex w-full flex-col gap-1 p-4 sm:max-w-[13rem]">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-emerald-500" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Patrimônio total</h2>
        </div>
        <MoneyValue value={totalPatrimony} className="text-xl font-bold tracking-tight tabular-nums text-emerald-500" />
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 shrink-0 text-emerald-500" />
          <span className="text-sm font-semibold">Ativos</span>
          {assets.length > 0 && <span className="text-xs text-muted-foreground">({assets.length})</span>}
        </div>

        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum ativo cadastrado ainda.</p>
        ) : (
          <ul className="-mx-2 flex flex-col gap-1">
            {assets.map((asset) => (
              <li
                key={asset.id}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50",
                  !asset.active && "opacity-55"
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <TrendingUp className="size-4 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium" title={asset.name}>
                    {asset.name}
                  </p>
                  <MoneyValue
                    value={asset.currentBalance}
                    className="text-sm font-medium tabular-nums text-emerald-500"
                  />
                </div>
                <Switch
                  checked={asset.active}
                  onCheckedChange={() => handleToggle(asset.id)}
                  aria-label={asset.active ? "Desativar ativo" : "Ativar ativo"}
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
              </li>
            ))}
          </ul>
        )}
      </Card>

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
