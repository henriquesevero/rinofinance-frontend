import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoneyValue } from "@/components/MoneyValue"
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
      <div className="flex items-center justify-between gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardDescription>Patrimônio total</CardDescription>
            <CardTitle className="text-2xl">
              <MoneyValue value={totalPatrimony} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Button onClick={() => setDialogState({ mode: "create" })}>
          <Plus className="size-4" />
          Novo ativo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investimentos e patrimônio</CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum ativo cadastrado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria/Ativo</TableHead>
                  <TableHead>Saldo atual</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id} className={!asset.active ? "opacity-50" : undefined}>
                    <TableCell className="max-w-[260px] truncate" title={asset.name}>
                      {asset.name}
                    </TableCell>
                    <TableCell>
                      <MoneyValue value={asset.currentBalance} />
                    </TableCell>
                    <TableCell>
                      <Switch checked={asset.active} onCheckedChange={() => handleToggle(asset.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar ativo"
                          onClick={() => setDialogState({ mode: "edit", asset })}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remover ativo"
                          onClick={() => handleDelete(asset.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
