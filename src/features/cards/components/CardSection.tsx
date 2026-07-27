import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Flag, Layers, Pencil, Plus, Repeat, ShoppingBag, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MoneyValue } from "@/components/MoneyValue"
import { BulkActionsMenu, type SortConfig } from "@/components/BulkActionsMenu"
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
import { logoDomain } from "../fatura/brands"
import { useCardsStore } from "../store"
import type { CardOverview, InstallmentPurchase, Subscription } from "../types"
import { CategoryChip } from "@/features/categories/components/CategoryChip"
import { useCategoriesStore } from "@/features/categories/store"
import { DragHandle } from "@/components/DragHandle"
import { useReorder } from "@/lib/useReorder"
import { BrandLogo } from "./BrandLogo"
import { InstallmentPurchaseFormDialog } from "./InstallmentPurchaseFormDialog"
import { SubscriptionFormDialog } from "./SubscriptionFormDialog"

type PurchaseDialogState =
  | { mode: "create"; oneOff: boolean }
  | { mode: "edit"; purchase: InstallmentPurchase }
  | null
type SubscriptionDialogState = { mode: "create" } | { mode: "edit"; subscription: Subscription } | null

export function CardSection({ card }: { card: CardOverview }) {
  const [purchaseDialog, setPurchaseDialog] = useState<PurchaseDialogState>(null)
  const [subscriptionDialog, setSubscriptionDialog] = useState<SubscriptionDialogState>(null)
  const [sortKey, setSortKey] = useState<PurchaseSortKey>("default")
  const [avulsaSortKey, setAvulsaSortKey] = useState<PurchaseSortKey>("default")
  const [subSortKey, setSubSortKey] = useState<SubscriptionSortKey>("default")
  const [collapsed, setCollapsed] = useState({ avulsas: false, parceladas: false, subs: false })
  const toggleCollapsed = (k: "avulsas" | "parceladas" | "subs") => setCollapsed((c) => ({ ...c, [k]: !c[k] }))

  const createInstallmentPurchase = useCardsStore((s) => s.createInstallmentPurchase)
  const updateInstallmentPurchase = useCardsStore((s) => s.updateInstallmentPurchase)
  const toggleInstallmentPurchaseFlag = useCardsStore((s) => s.toggleInstallmentPurchaseFlag)
  const deleteInstallmentPurchase = useCardsStore((s) => s.deleteInstallmentPurchase)
  const createSubscription = useCardsStore((s) => s.createSubscription)
  const updateSubscription = useCardsStore((s) => s.updateSubscription)
  const deleteSubscription = useCardsStore((s) => s.deleteSubscription)
  const reorderInstallmentPurchases = useCardsStore((s) => s.reorderInstallmentPurchases)
  const reorderSubscriptions = useCardsStore((s) => s.reorderSubscriptions)

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
    () => sortPurchases(card.installmentPurchases.filter((p) => p.totalInstallments === 1), avulsaSortKey, categoryName),
    [card.installmentPurchases, avulsaSortKey, categoryName]
  )
  const parceladas = useMemo(
    () => sortPurchases(card.installmentPurchases.filter((p) => p.totalInstallments > 1), sortKey, categoryName),
    [card.installmentPurchases, sortKey, categoryName]
  )
  const sortedSubscriptions = useMemo(
    () => sortSubscriptions(card.subscriptions, subSortKey, categoryName),
    [card.subscriptions, subSortKey, categoryName]
  )

  // Manual reordering only applies to the "Ordem padrão" (position) sort.
  // Avulsas and parceladas share one entity, so each group persists the full
  // purchase order with the other group left in place.
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

  const avulsaSort: SortConfig | undefined =
    avulsas.length > 1
      ? { value: avulsaSortKey, onChange: (v) => setAvulsaSortKey((v as PurchaseSortKey) ?? "default"), options: ONE_OFF_SORT_OPTIONS }
      : undefined
  const parceladaSort: SortConfig | undefined =
    parceladas.length > 1
      ? { value: sortKey, onChange: (v) => setSortKey((v as PurchaseSortKey) ?? "default"), options: PURCHASE_SORT_OPTIONS }
      : undefined
  const subSort: SortConfig | undefined =
    card.subscriptions.length > 1
      ? { value: subSortKey, onChange: (v) => setSubSortKey((v as SubscriptionSortKey) ?? "default"), options: SUBSCRIPTION_SORT_OPTIONS }
      : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 p-5">
          <GroupHeader
            icon={ShoppingBag}
            title="Compras avulsas"
            count={avulsas.length}
            collapsed={collapsed.avulsas}
            onToggle={() => toggleCollapsed("avulsas")}
            sort={avulsaSort}
            onAdd={() => setPurchaseDialog({ mode: "create", oneOff: true })}
            addLabel="Nova compra avulsa"
          />
          {!collapsed.avulsas &&
            (avulsas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma compra avulsa.</p>
            ) : (
              <ul className="scrollbar-hide -mx-2 flex max-h-[22rem] flex-col gap-1 overflow-y-auto px-2">
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
            ))}
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <GroupHeader
            icon={Layers}
            title="Compras parceladas"
            count={parceladas.length}
            collapsed={collapsed.parceladas}
            onToggle={() => toggleCollapsed("parceladas")}
            sort={parceladaSort}
            onAdd={() => setPurchaseDialog({ mode: "create", oneOff: false })}
            addLabel="Nova compra parcelada"
          />
          {!collapsed.parceladas &&
            (parceladas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma compra parcelada.</p>
            ) : (
              <ul className="scrollbar-hide -mx-2 flex max-h-[22rem] flex-col gap-1 overflow-y-auto px-2">
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
            ))}
        </Card>
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <GroupHeader
          icon={Repeat}
          title="Assinaturas mensais"
          count={card.subscriptions.length}
          collapsed={collapsed.subs}
          onToggle={() => toggleCollapsed("subs")}
          sort={subSort}
          onAdd={() => setSubscriptionDialog({ mode: "create" })}
          addLabel="Nova assinatura"
        />
        {!collapsed.subs &&
          (card.subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma assinatura.</p>
          ) : (
            <ul className="scrollbar-hide grid max-h-[22rem] grid-cols-2 gap-2.5 overflow-y-auto sm:grid-cols-3 lg:grid-cols-5">
              {subsDnd.order.map((subscription) => (
                <li
                  key={subscription.id}
                  {...subsDnd.getItemProps(subscription.id)}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg border bg-card p-2.5 transition-colors hover:border-foreground/20",
                    subsDnd.draggingId === subscription.id && "opacity-40"
                  )}
                >
                  {canReorderSubs && (
                    <DragHandle
                      {...subsDnd.getHandleProps(subscription.id)}
                      className="absolute left-0.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                    />
                  )}
                  <BrandLogo
                    domain={logoDomain(subscription.name, subscription.domain)}
                    fallbackIcon={Repeat}
                    size={64}
                    className="size-9 shrink-0 rounded-md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={subscription.name}>
                      {subscription.name}
                    </p>
                    <MoneyValue
                      value={subscription.monthlyAmount}
                      className="text-xs font-medium text-muted-foreground tabular-nums"
                    />
                  </div>
                  {/* hover actions overlay the value area, keeping the tile compact */}
                  <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 rounded-r-lg bg-card pl-4 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 [@media(hover:none)]:static [@media(hover:none)]:bg-transparent [@media(hover:none)]:pl-0 [@media(hover:none)]:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Editar assinatura"
                      onClick={() => setSubscriptionDialog({ mode: "edit", subscription })}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Remover assinatura"
                      onClick={() => handleDeleteSubscription(subscription.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </Card>

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
    </div>
  )
}

// Header row shared by the three groups: a collapse toggle (chevron + icon +
// title + count) and, on the right, a discreet "..." sort menu plus a "+".
function GroupHeader({
  icon: Icon,
  title,
  count,
  collapsed,
  onToggle,
  sort,
  onAdd,
  addLabel,
}: {
  icon: typeof ShoppingBag
  title: string
  count: number
  collapsed: boolean
  onToggle: () => void
  sort?: SortConfig
  onAdd: () => void
  addLabel: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button type="button" onClick={onToggle} aria-expanded={!collapsed} className="flex min-w-0 items-center gap-2 text-left">
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", collapsed && "-rotate-90")} />
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-semibold">{title}</span>
        {count > 0 && <span className="shrink-0 text-xs text-muted-foreground">({count})</span>}
      </button>
      <div className="flex shrink-0 items-center gap-1">
        {sort && <BulkActionsMenu groups={[]} sort={sort} />}
        <Button variant="ghost" size="icon" className="size-8" onClick={onAdd} aria-label={addLabel} title={addLabel}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
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
        "group relative flex flex-col gap-1 rounded-md px-2 py-2 sm:flex-row sm:items-center sm:gap-3",
        purchase.flagged ? "bg-red-500/10 hover:bg-red-500/15" : "hover:bg-muted/50",
        dragging && "opacity-40"
      )}
    >
      <div className="flex min-w-0 items-center gap-3 sm:flex-1">
        {handleProps && <DragHandle {...handleProps} className="hidden shrink-0 opacity-0 group-hover:opacity-100 sm:block" />}
        <BrandLogo domain={logoDomain(purchase.name, purchase.domain)} fallbackIcon={ShoppingBag} />
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
      </div>
      <div className="flex items-center justify-between gap-2 pl-11 sm:contents sm:pl-0">
        <MoneyValue
          value={purchase.installmentAmount}
          className="shrink-0 font-medium tabular-nums sm:transition-opacity sm:group-hover:opacity-0"
        />
        <div className="flex shrink-0 items-center sm:absolute sm:inset-y-0 sm:right-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={purchase.flagged ? "Remover atenção" : "Marcar em atenção"}
            onClick={onToggleFlag}
          >
            <Flag className={cn("size-4", purchase.flagged && "fill-red-500 text-red-500")} />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Editar compra" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Remover compra" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </li>
  )
}
