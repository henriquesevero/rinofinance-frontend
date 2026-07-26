import { useState } from "react"
import { CreditCard, Landmark, Layers, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AccountDebitQuickDialog } from "./AccountDebitQuickDialog"
import { CardPurchaseDialog } from "./CardPurchaseDialog"

type Action = "debit" | "credit" | "installment" | null

// A single discreet dropdown to quickly log a purchase (debit, credit or
// installment) without leaving the page — replaces the old row of buttons.
export function QuickActions() {
  const [action, setAction] = useState<Action>(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="size-9 shrink-0" aria-label="Lançar compra" title="Lançar compra">
              <Plus className="size-5" />
            </Button>
          }
        />
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setAction("debit")}>
            <Landmark className="size-4" />
            Compra no débito
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAction("credit")}>
            <CreditCard className="size-4" />
            Compra no crédito
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAction("installment")}>
            <Layers className="size-4" />
            Compra parcelada
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountDebitQuickDialog open={action === "debit"} onOpenChange={(o) => !o && setAction(null)} />
      <CardPurchaseDialog open={action === "credit"} onOpenChange={(o) => !o && setAction(null)} mode="credit" />
      <CardPurchaseDialog open={action === "installment"} onOpenChange={(o) => !o && setAction(null)} mode="installment" />
    </>
  )
}
