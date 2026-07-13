import { useEffect, useMemo, useState } from "react"
import { Eraser, FileUp, Flag, Pencil, Plus, Repeat, ShoppingBag, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoneyValue } from "@/components/MoneyValue"
import { toErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import {
  currentInstallment,
  installmentEndLabel,
  ONE_OFF_SORT_OPTIONS,
  PURCHASE_SORT_OPTIONS,
  sortPurchases,
  sortSubscriptions,
  SUBSCRIPTION_SORT_OPTIONS,
  type PurchaseSortKey,
  type SubscriptionSortKey,
} from "../installments"
import { useCardsStore } from "../store"
import type { CardOverview, InstallmentPurchase, Subscription } from "../types"
import { CategoryChip } from "@/features/categories/components/CategoryChip"
import { useCategoriesStore } from "@/features/categories/store"
import { DragHandle } from "@/components/DragHandle"
import { useReorder } from "@/lib/useReorder"
import { BrandLogo } from "./BrandLogo"
import { CardLogo } from "./CardLogo"
import { ClearCardDialog } from "./ClearCardDialog"
import { ImportFaturaDialog } from "./ImportFaturaDialog"
import { InstallmentPurchaseFormDialog } from "./InstallmentPurchaseFormDialog"
import { SubscriptionFormDialog } from "./SubscriptionFormDialog"

type PurchaseDialogState =
  | { mode: "create"; oneOff: boolean }
  | { mode: "edit"; purchase: InstallmentPurchase }
  | null
type SubscriptionDialogState = { mode: "create" } | { mode: "edit"; subscription: Subscription } | null

export function CardSection({ card, onDeleted }: { card: CardOverview; onDeleted?: () => void }) {
  const [isImporting, setIsImporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [purchaseDialog, setPurchaseDialog] = useState<PurchaseDialogState>(null)
  const [subscriptionDialog, setSubscriptionDialog] = useState<SubscriptionDialogState>(null)
  const [sortKey, setSortKey] = useState<PurchaseSortKey>("default")
  const [avulsaSortKey, setAvulsaSortKey] = useState<PurchaseSortKey>("default")
  const [subSortKey, setSubSortKey] = useState<SubscriptionSortKey>("default")

  const deleteCard = useCardsStore((s) => s.deleteCard)
  const createInstallmentPurchase = useCardsStore((s) => s.createInstallmentPurchase)
  const updateInstallmentPurchase = useCardsStore((s) => s.updateInstallmentPurchase)
  const toggleInstallmentPurchaseFlag = useCardsStore((s) => s.toggleInstallmentPurchaseFlag)
  const deleteInstallmentPurchase = useCardsStore((s) => s.deleteInstallmentPurchase)

  const categories = useCategoriesStore((s) => s.categories)
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories)
  useEffect(() => {
    if (categories.length === 0) fetchCategories()
  }, [categories.length, fetchCategories])

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]))
    return (id?: string) => (id ? map.get(id) ?? "" : "")
  }, [categories])

  const avulsas = useMemo(
    () =>
      sortPurchases(
        card.installmentPurchases.filter((p) => p.totalInstallments === 1),
        avulsaSortKey,
        categoryName
      ),
    [card.installmentPurchases, avulsaSortKey, categoryName]
  )
  const parceladas = useMemo(
    () =>
      sortPurchases(
        card.installmentPurchases.filter((p) => p.totalInstallments > 1),
        sortKey,
        categoryName
      ),
    [card.installmentPurchases, sortKey, categoryName]
  )
  const sortedSubscriptions = useMemo(
    () => sortSubscriptions(card.subscriptions, subSortKey, categoryName),
    [card.subscriptions, subSortKey, categoryName]
  )
  const createSubscription = useCardsStore((s) => s.createSubscription)
  const updateSubscription = useCardsStore((s) => s.updateSubscription)
  const deleteSubscription = useCardsStore((s) => s.deleteSubscription)
  const reorderInstallmentPurchases = useCardsStore((s) => s.reorderInstallmentPurchases)
  const reorderSubscriptions = useCardsStore((s) => s.reorderSubscriptions)

  // Manual reordering only applies to the "Ordem padrão" (position) sort;
  // other sorts are computed views. Avulsas and parceladas share one
  // entity, so each group persists the full purchase order with the other
  // group left in place.
  const canReorderAvulsas = avulsaSortKey === "default"
  const canReorderParceladas = sortKey === "default"
  const canReorderSubs = subSortKey === "default"
  const avulsasDnd = useReorder(avulsas, (ids) =>
    reorderInstallmentPurchases(card.id, [...ids, ...parceladas.map((p) => p.id)])
  )
  const parceladasDnd = useReorder(parceladas, (ids) =>
    reorderInstallmentPurchases(card.id, [...avulsas.map((p) => p.id), ...ids])
  )
  const subsDnd = useReorder(sortedSubscriptions, (ids) => reorderSubscriptions(card.id, ids))

  async function handleDeleteCard() {
    try {
      await deleteCard(card.id)
      toast.success("Cartão removido")
      onDeleted?.()
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleDeletePurchase(id: string) {
    try {
      await deleteInstallmentPurchase(id)
      toast.success("Compra removida")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleToggleFlag(id: string) {
    try {
      await toggleInstallmentPurchaseFlag(id)
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleDeleteSubscription(id: string) {
    try {
      await deleteSubscription(id)
      toast.success("Assinatura removida")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <CardLogo name={card.name} color={card.color} logoUrl={card.logoUrl} />
          <CardTitle className="truncate">{card.name}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setIsImporting(true)}>
            <FileUp className="size-4" />
            Importar fatura
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsClearing(true)}>
            <Eraser className="size-4" />
            Limpar
          </Button>
          <Button variant="ghost" size="icon" aria-label="Remover cartão" onClick={handleDeleteCard}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ShoppingBag className="size-4" />
                Compras avulsas
              </h3>
              <div className="flex items-center gap-2">
                {avulsas.length > 1 && (
                  <Select
                    value={avulsaSortKey}
                    onValueChange={(v) => setAvulsaSortKey((v as PurchaseSortKey) ?? "default")}
                  >
                    <SelectTrigger size="sm" className="min-w-0 flex-1 sm:w-[140px] sm:flex-none" aria-label="Ordenar avulsas">
                      <SelectValue>
                        {(value: string | null) =>
                          ONE_OFF_SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Ordenar"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ONE_OFF_SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" size="sm" onClick={() => setPurchaseDialog({ mode: "create", oneOff: true })}>
                  <Plus className="size-4" />
                  Nova avulsa
                </Button>
              </div>
            </div>
            {avulsas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma compra avulsa.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {avulsasDnd.order.map((purchase) => (
                  <PurchaseRow
                    key={purchase.id}
                    purchase={purchase}
                    dragging={avulsasDnd.draggingId === purchase.id}
                    itemProps={avulsasDnd.getItemProps(purchase.id)}
                    handleProps={canReorderAvulsas ? avulsasDnd.getHandleProps(purchase.id) : undefined}
                    onToggleFlag={() => handleToggleFlag(purchase.id)}
                    onEdit={() => setPurchaseDialog({ mode: "edit", purchase })}
                    onDelete={() => handleDeletePurchase(purchase.id)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ShoppingBag className="size-4" />
                Compras parceladas
              </h3>
              <div className="flex items-center gap-2">
                {parceladas.length > 1 && (
                  <Select value={sortKey} onValueChange={(v) => setSortKey((v as PurchaseSortKey) ?? "default")}>
                    <SelectTrigger size="sm" className="min-w-0 flex-1 sm:w-[150px] sm:flex-none" aria-label="Ordenar compras">
                      <SelectValue>
                        {(value: string | null) =>
                          PURCHASE_SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Ordenar"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PURCHASE_SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" size="sm" onClick={() => setPurchaseDialog({ mode: "create", oneOff: false })}>
                  <Plus className="size-4" />
                  Nova compra
                </Button>
              </div>
            </div>
            {parceladas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma compra parcelada.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {parceladasDnd.order.map((purchase) => (
                  <PurchaseRow
                    key={purchase.id}
                    purchase={purchase}
                    dragging={parceladasDnd.draggingId === purchase.id}
                    itemProps={parceladasDnd.getItemProps(purchase.id)}
                    handleProps={canReorderParceladas ? parceladasDnd.getHandleProps(purchase.id) : undefined}
                    onToggleFlag={() => handleToggleFlag(purchase.id)}
                    onEdit={() => setPurchaseDialog({ mode: "edit", purchase })}
                    onDelete={() => handleDeletePurchase(purchase.id)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Repeat className="size-4" />
              Assinaturas mensais
            </h3>
            <div className="flex items-center gap-2">
              {card.subscriptions.length > 1 && (
                <Select
                  value={subSortKey}
                  onValueChange={(v) => setSubSortKey((v as SubscriptionSortKey) ?? "default")}
                >
                  <SelectTrigger size="sm" className="min-w-0 flex-1 sm:w-[140px] sm:flex-none" aria-label="Ordenar assinaturas">
                    <SelectValue>
                      {(value: string | null) =>
                        SUBSCRIPTION_SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Ordenar"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" size="sm" onClick={() => setSubscriptionDialog({ mode: "create" })}>
                <Plus className="size-4" />
                Nova assinatura
              </Button>
            </div>
          </div>
          {card.subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma assinatura.</p>
          ) : (
            <ul className="grid gap-1 lg:grid-cols-2">
              {subsDnd.order.map((subscription) => (
                <li
                  key={subscription.id}
                  {...subsDnd.getItemProps(subscription.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50",
                    subsDnd.draggingId === subscription.id && "opacity-40"
                  )}
                >
                  {canReorderSubs && <DragHandle {...subsDnd.getHandleProps(subscription.id)} />}
                  <BrandLogo domain={subscription.domain} fallbackIcon={Repeat} />
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="min-w-0 truncate font-medium" title={subscription.name}>
                      {subscription.name}
                    </span>
                    <CategoryChip categoryId={subscription.categoryId} />
                  </span>
                  <MoneyValue value={subscription.monthlyAmount} className="shrink-0 font-medium tabular-nums" />
                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar assinatura"
                      onClick={() => setSubscriptionDialog({ mode: "edit", subscription })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover assinatura"
                      onClick={() => handleDeleteSubscription(subscription.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>

      <ImportFaturaDialog
        open={isImporting}
        onOpenChange={setIsImporting}
        cardId={card.id}
        cardName={card.name}
      />

      <ClearCardDialog open={isClearing} onOpenChange={setIsClearing} card={card} />

      <InstallmentPurchaseFormDialog
        open={purchaseDialog !== null}
        onOpenChange={(open) => !open && setPurchaseDialog(null)}
        purchase={purchaseDialog?.mode === "edit" ? purchaseDialog.purchase : undefined}
        oneOff={
          purchaseDialog?.mode === "create"
            ? purchaseDialog.oneOff
            : purchaseDialog?.mode === "edit"
              ? purchaseDialog.purchase.totalInstallments === 1
              : false
        }
        onSubmit={async (input) => {
          if (purchaseDialog?.mode === "edit") {
            await updateInstallmentPurchase(purchaseDialog.purchase.id, input)
            toast.success("Compra atualizada")
          } else {
            await createInstallmentPurchase(card.id, input)
            toast.success("Compra criada")
          }
        }}
      />

      <SubscriptionFormDialog
        open={subscriptionDialog !== null}
        onOpenChange={(open) => !open && setSubscriptionDialog(null)}
        subscription={subscriptionDialog?.mode === "edit" ? subscriptionDialog.subscription : undefined}
        onSubmit={async (input) => {
          if (subscriptionDialog?.mode === "edit") {
            await updateSubscription(subscriptionDialog.subscription.id, input)
            toast.success("Assinatura atualizada")
          } else {
            await createSubscription(card.id, input)
            toast.success("Assinatura criada")
          }
        }}
      />
    </Card>
  )
}

// A single purchase row, shared by the "avulsas" and "parceladas" lists.
// One-off purchases (totalInstallments === 1) show just their value; the
// installment detail subline only makes sense for parcelas.
function PurchaseRow({
  purchase,
  onToggleFlag,
  onEdit,
  onDelete,
  dragging,
  itemProps,
  handleProps,
}: {
  purchase: InstallmentPurchase
  onToggleFlag: () => void
  onEdit: () => void
  onDelete: () => void
  dragging?: boolean
  itemProps?: React.HTMLAttributes<HTMLLIElement>
  handleProps?: React.HTMLAttributes<HTMLSpanElement> & { draggable?: boolean }
}) {
  const isInstallment = purchase.totalInstallments > 1
  return (
    <li
      {...itemProps}
      className={cn(
        "flex items-center gap-3 rounded-md px-2 py-2",
        purchase.flagged ? "bg-red-500/10 hover:bg-red-500/15" : "hover:bg-muted/50",
        dragging && "opacity-40"
      )}
    >
      {handleProps && <DragHandle {...handleProps} />}
      <BrandLogo domain={purchase.domain} fallbackIcon={ShoppingBag} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 truncate font-medium" title={purchase.name}>
            {purchase.name}
          </p>
          <CategoryChip categoryId={purchase.categoryId} />
        </div>
        {isInstallment && (
          <p className="flex flex-wrap gap-x-1.5 text-xs leading-snug text-muted-foreground">
            <span className="whitespace-nowrap">
              Parcela {currentInstallment(purchase)}/{purchase.totalInstallments}
            </span>
            <span className="whitespace-nowrap">
              · total <MoneyValue value={purchase.installmentAmount * purchase.totalInstallments} />
            </span>
            <span className="whitespace-nowrap">· termina em {installmentEndLabel(purchase)}</span>
          </p>
        )}
      </div>
      <MoneyValue value={purchase.installmentAmount} className="shrink-0 font-medium tabular-nums" />
      <div className="flex shrink-0 items-center">
        <Button
          variant="ghost"
          size="icon"
          aria-label={purchase.flagged ? "Remover atenção" : "Marcar em atenção"}
          onClick={onToggleFlag}
        >
          <Flag className={cn("size-4", purchase.flagged && "fill-red-500 text-red-500")} />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Editar compra" onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Remover compra" onClick={onDelete}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  )
}
