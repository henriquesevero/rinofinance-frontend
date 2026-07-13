import { useState } from "react"
import { CreditCard, Landmark, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AccountDebitQuickDialog } from "./AccountDebitQuickDialog"
import { CardPurchaseDialog } from "./CardPurchaseDialog"

type Action = "debit" | "credit" | "installment" | null

// Quick-launch buttons at the top of the dashboard so the user can record
// a purchase without navigating to the cards or expenses screens.
export function QuickActions() {
  const [action, setAction] = useState<Action>(null)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setAction("debit")}>
          <Landmark className="size-4" />
          Compra no débito
        </Button>
        <Button variant="outline" onClick={() => setAction("credit")}>
          <CreditCard className="size-4" />
          Compra no crédito
        </Button>
        <Button variant="outline" onClick={() => setAction("installment")}>
          <Layers className="size-4" />
          Compra parcelada
        </Button>
      </div>

      <AccountDebitQuickDialog open={action === "debit"} onOpenChange={(o) => !o && setAction(null)} />
      <CardPurchaseDialog
        open={action === "credit"}
        onOpenChange={(o) => !o && setAction(null)}
        mode="credit"
      />
      <CardPurchaseDialog
        open={action === "installment"}
        onOpenChange={(o) => !o && setAction(null)}
        mode="installment"
      />
    </>
  )
}
