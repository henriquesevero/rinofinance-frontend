import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Card className="min-w-0 flex-1">
          <CardHeader>
            <CardDescription>Patrimônio total</CardDescription>
            <CardTitle className="text-2xl">
              <MoneyValue value={totalPatrimony} />
            </CardTitle>
          </CardHeader>
        </Card>
        <div className="flex shrink-0 items-center gap-1">
          <ValuesVisibilityToggle />
          <Button onClick={() => setDialogState({ mode: "create" })}>
            <Plus className="size-4" />
            Novo ativo
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investimentos e patrimônio</CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum ativo cadastrado ainda.</p>
          ) : (
            <ul className="divide-y">
              {assets.map((asset) => (
                <li
                  key={asset.id}
                  className={cn("flex items-center gap-3 py-3", !asset.active && "opacity-55")}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium" title={asset.name}>
                      {asset.name}
                    </p>
                    <MoneyValue
                      value={asset.currentBalance}
                      className="text-sm tabular-nums text-muted-foreground"
                    />
                  </div>
                  <Switch
                    checked={asset.active}
                    onCheckedChange={() => handleToggle(asset.id)}
                    aria-label={asset.active ? "Desativar ativo" : "Ativar ativo"}
                  />
                  <div className="flex shrink-0 items-center">
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
        </CardContent>
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
