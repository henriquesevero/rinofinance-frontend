import { useEffect, useState, type FormEvent } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toErrorMessage } from "@/lib/errors"
import { useAccountsStore } from "../store"

interface PluggySyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Imports a Pluggy connection by its item id: pulls the checking account(s)
// and their transactions (entradas/saídas), auto-categorized. This is the
// first step of the Pluggy integration; the in-app Connect widget comes later.
export function PluggySyncDialog({ open, onOpenChange }: PluggySyncDialogProps) {
  const syncPluggy = useAccountsStore((s) => s.syncPluggy)
  const [itemId, setItemId] = useState("")
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (open) setItemId("")
  }, [open])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const id = itemId.trim()
    if (!id) return
    setIsSyncing(true)
    try {
      const r = await syncPluggy(id)
      toast.success(
        `${r.accountsSynced} conta(s) · ${r.transactionsImported} transação(ões) importada(s)` +
          (r.transactionsSkipped ? ` · ${r.transactionsSkipped} já existente(s)` : "")
      )
      onOpenChange(false)
    } catch (err) {
      toast.error(toErrorMessage(err))
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sincronizar com o Pluggy</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pluggy-item">ID da conexão (itemId)</Label>
            <Input
              id="pluggy-item"
              autoFocus
              placeholder="00000000-0000-0000-0000-000000000000"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Puxa a conta corrente e as transações da conexão (entradas e saídas), já categorizadas. Re-sincronizar é
              seguro — transações já importadas não duplicam.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSyncing}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSyncing || !itemId.trim()}>
              {isSyncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              {isSyncing ? "Sincronizando..." : "Sincronizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
