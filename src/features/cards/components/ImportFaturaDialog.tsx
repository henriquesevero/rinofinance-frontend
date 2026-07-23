import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatMoney } from "@/lib/money"
import { toErrorMessage } from "@/lib/errors"
import { CategorySelect } from "@/features/categories/components/CategorySelect"
import { useCategoriesStore } from "@/features/categories/store"
import { extractPdfLines } from "../fatura/pdf"
import { suggestCategoryId } from "../fatura/categoryRules"
import {
  parseFaturaLines,
  type ParsedFatura,
  type ParsedInstallment,
  type ParsedSubscription,
  type SkippedLine,
} from "../fatura/parseFatura"
import { parseNubankCsv } from "../fatura/parseNubankCsv"
import { installmentEndLabel } from "../installments"
import { useCardsStore } from "../store"

interface ImportFaturaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cardId: string
  cardName: string
}

type Stage = "select" | "parsing" | "preview" | "importing"

// Rows shown in the preview, each with a checkbox so the user can drop
// mis-read or unwanted lines before confirming.
interface PreviewInstallment extends ParsedInstallment {
  key: string
  checked: boolean
  categoryId: string
}
interface PreviewSubscription extends ParsedSubscription {
  key: string
  checked: boolean
  categoryId: string
}

export function ImportFaturaDialog({ open, onOpenChange, cardId, cardName }: ImportFaturaDialogProps) {
  const importFatura = useCardsStore((s) => s.importFatura)
  const categories = useCategoriesStore((s) => s.categories)
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Ensure categories are loaded so auto-categorization can resolve them.
  useEffect(() => {
    if (categories.length === 0) fetchCategories()
  }, [categories.length, fetchCategories])
  const [stage, setStage] = useState<Stage>("select")
  const [installments, setInstallments] = useState<PreviewInstallment[]>([])
  const [subscriptions, setSubscriptions] = useState<PreviewSubscription[]>([])
  const [notImported, setNotImported] = useState<SkippedLine[]>([])

  function reset() {
    setStage("select")
    setInstallments([])
    setSubscriptions([])
    setNotImported([])
  }

  function handleClose(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv"

    setStage("parsing")
    try {
      let parsed: ParsedFatura
      if (isCsv) {
        parsed = parseNubankCsv(await file.text())
      } else {
        parsed = parseFaturaLines(await extractPdfLines(file))
      }
      if (parsed.installmentPurchases.length === 0 && parsed.subscriptions.length === 0) {
        toast.error(isCsv ? "Nenhuma compra reconhecida neste CSV" : "Nenhuma compra reconhecida neste PDF")
        setStage("select")
        return
      }
      setInstallments(
        parsed.installmentPurchases.map((p, i) => ({
          ...p,
          key: `p-${i}`,
          checked: true,
          categoryId: suggestCategoryId(p.name, categories),
        }))
      )
      setSubscriptions(
        parsed.subscriptions.map((s, i) => ({
          ...s,
          key: `s-${i}`,
          checked: true,
          categoryId: suggestCategoryId(s.name, categories),
        }))
      )
      setNotImported(parsed.notImported)
      setStage("preview")
    } catch (err) {
      toast.error(toErrorMessage(err, "Não foi possível ler o arquivo"))
      setStage("select")
    }
  }

  // Parceladas ordered by installments still remaining — most-remaining
  // first, down to the ones closest to finishing.
  const parceladas = useMemo(
    () =>
      installments
        .filter((p) => !p.isSingle)
        .sort((a, b) => {
          const remA = a.totalInstallments - a.currentInstallment
          const remB = b.totalInstallments - b.currentInstallment
          return remB - remA || b.totalInstallments - a.totalInstallments
        }),
    [installments]
  )
  const avulsas = useMemo(() => installments.filter((p) => p.isSingle), [installments])

  const selectedCount =
    installments.filter((p) => p.checked).length + subscriptions.filter((s) => s.checked).length

  function toggleInstallment(key: string) {
    setInstallments((prev) => prev.map((p) => (p.key === key ? { ...p, checked: !p.checked } : p)))
  }
  function toggleSubscription(key: string) {
    setSubscriptions((prev) => prev.map((s) => (s.key === key ? { ...s, checked: !s.checked } : s)))
  }
  function setInstallmentCategory(key: string, categoryId: string) {
    setInstallments((prev) => prev.map((p) => (p.key === key ? { ...p, categoryId } : p)))
  }
  function setSubscriptionCategory(key: string, categoryId: string) {
    setSubscriptions((prev) => prev.map((s) => (s.key === key ? { ...s, categoryId } : s)))
  }
  // Selects/deselects every installment matching the group predicate at
  // once (used by the group-header checkbox).
  function setInstallmentGroup(predicate: (p: PreviewInstallment) => boolean, checked: boolean) {
    setInstallments((prev) => prev.map((p) => (predicate(p) ? { ...p, checked } : p)))
  }
  function setSubscriptionGroup(checked: boolean) {
    setSubscriptions((prev) => prev.map((s) => ({ ...s, checked })))
  }
  function setAll(checked: boolean) {
    setInstallments((prev) => prev.map((p) => ({ ...p, checked })))
    setSubscriptions((prev) => prev.map((s) => ({ ...s, checked })))
  }

  async function handleImport() {
    setStage("importing")
    try {
      const result = await importFatura(cardId, {
        installmentPurchases: installments
          .filter((p) => p.checked)
          .map((p) => ({
            name: p.name,
            installmentAmount: p.installmentAmount,
            totalInstallments: p.totalInstallments,
            firstInstallmentDate: p.firstInstallmentDate,
            domain: p.domain,
            categoryId: p.categoryId,
          })),
        subscriptions: subscriptions
          .filter((s) => s.checked)
          .map((s) => ({ name: s.name, monthlyAmount: s.monthlyAmount, domain: s.domain, categoryId: s.categoryId })),
      })
      toast.success(`Importado: ${result.installmentPurchases} compra(s) e ${result.subscriptions} assinatura(s)`)
      handleClose(false)
    } catch (err) {
      toast.error(toErrorMessage(err))
      setStage("preview")
    }
  }

  const parceladasChecked = parceladas.filter((p) => p.checked).length
  const avulsasChecked = avulsas.filter((p) => p.checked).length
  const subsChecked = subscriptions.filter((s) => s.checked).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar fatura — {cardName}</DialogTitle>
        </DialogHeader>

        {(stage === "select" || stage === "parsing") && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Selecione a fatura deste cartão — <strong>PDF</strong> (ex.: Itaú) ou <strong>CSV</strong> (ex.:
              Nubank). As compras parceladas, avulsas e assinaturas serão detectadas automaticamente para você
              revisar antes de importar.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.csv,text/csv"
              className="hidden"
              onChange={handleFile}
            />
            <Button disabled={stage === "parsing"} onClick={() => fileInputRef.current?.click()}>
              {stage === "parsing" ? "Lendo fatura..." : "Selecionar fatura"}
            </Button>
          </div>
        )}

        {(stage === "preview" || stage === "importing") && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedCount} de {installments.length + subscriptions.length} selecionados
              </span>
              <div className="flex gap-3">
                <button type="button" className="underline underline-offset-4" onClick={() => setAll(true)}>
                  Marcar todos
                </button>
                <button type="button" className="underline underline-offset-4" onClick={() => setAll(false)}>
                  Desmarcar todos
                </button>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto rounded-lg border">
              {parceladas.length > 0 && (
                <PreviewGroup
                  title="Compras parceladas"
                  total={parceladas.length}
                  checkedCount={parceladasChecked}
                  onToggleAll={(checked) => setInstallmentGroup((p) => !p.isSingle, checked)}
                >
                  {parceladas.map((p) => (
                    <PreviewRow
                      key={p.key}
                      checked={p.checked}
                      onToggle={() => toggleInstallment(p.key)}
                      category={
                        <div className="w-full sm:w-64">
                          <CategorySelect value={p.categoryId} onChange={(id) => setInstallmentCategory(p.key, id)} />
                        </div>
                      }
                    >
                      <span className="truncate" title={p.name}>
                        {p.name}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {p.currentInstallment}/{p.totalInstallments} · até {installmentEndLabel(p)}
                      </span>
                      <span className="shrink-0 font-medium">{formatMoney(p.installmentAmount)}</span>
                    </PreviewRow>
                  ))}
                </PreviewGroup>
              )}

              {subscriptions.length > 0 && (
                <PreviewGroup
                  title="Assinaturas"
                  total={subscriptions.length}
                  checkedCount={subsChecked}
                  onToggleAll={setSubscriptionGroup}
                >
                  {subscriptions.map((s) => (
                    <PreviewRow
                      key={s.key}
                      checked={s.checked}
                      onToggle={() => toggleSubscription(s.key)}
                      category={
                        <div className="w-full sm:w-64">
                          <CategorySelect value={s.categoryId} onChange={(id) => setSubscriptionCategory(s.key, id)} />
                        </div>
                      }
                    >
                      <span className="truncate" title={s.name}>
                        {s.name}
                      </span>
                      <span className="shrink-0 text-muted-foreground">mensal</span>
                      <span className="shrink-0 font-medium">{formatMoney(s.monthlyAmount)}</span>
                    </PreviewRow>
                  ))}
                </PreviewGroup>
              )}

              {avulsas.length > 0 && (
                <PreviewGroup
                  title="Compras avulsas — importadas como 1x"
                  total={avulsas.length}
                  checkedCount={avulsasChecked}
                  onToggleAll={(checked) => setInstallmentGroup((p) => p.isSingle, checked)}
                >
                  {avulsas.map((p) => (
                    <PreviewRow
                      key={p.key}
                      checked={p.checked}
                      onToggle={() => toggleInstallment(p.key)}
                      category={
                        <div className="w-full sm:w-64">
                          <CategorySelect value={p.categoryId} onChange={(id) => setInstallmentCategory(p.key, id)} />
                        </div>
                      }
                    >
                      <span className="truncate" title={p.name}>
                        {p.name}
                      </span>
                      <span className="shrink-0 text-muted-foreground">1x</span>
                      <span className="shrink-0 font-medium">{formatMoney(p.installmentAmount)}</span>
                    </PreviewRow>
                  ))}
                </PreviewGroup>
              )}
            </div>

            {notImported.length > 0 && (
              <details className="rounded-lg border">
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground">
                  Não importados ({notImported.length})
                </summary>
                <div className="max-h-40 overflow-y-auto border-t">
                  {notImported.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-1.5 text-sm text-muted-foreground"
                    >
                      <span className="truncate" title={item.description}>
                        {item.description}
                      </span>
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs">{item.reason}</span>
                      <span className="shrink-0 tabular-nums">
                        {item.amount != null ? formatMoney(item.amount) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)} disabled={stage === "importing"}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={stage === "importing" || selectedCount === 0}>
                {stage === "importing" ? "Importando..." : `Importar ${selectedCount} item(ns)`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PreviewGroup({
  title,
  total,
  checkedCount,
  onToggleAll,
  children,
}: {
  title: string
  total: number
  checkedCount: number
  onToggleAll: (checked: boolean) => void
  children: React.ReactNode
}) {
  const allChecked = checkedCount === total
  const someChecked = checkedCount > 0 && !allChecked

  return (
    <div className="border-b last:border-b-0">
      <label className="sticky top-0 flex cursor-pointer items-center gap-2 bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
        <input
          type="checkbox"
          className="size-3.5 shrink-0"
          checked={allChecked}
          ref={(el) => {
            if (el) el.indeterminate = someChecked
          }}
          onChange={() => onToggleAll(!allChecked)}
        />
        {title} ({checkedCount}/{total})
      </label>
      {children}
    </div>
  )
}

function PreviewRow({
  checked,
  onToggle,
  category,
  children,
}: {
  checked: boolean
  onToggle: () => void
  category?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="px-3 py-2 hover:bg-muted/40">
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" className="size-4 shrink-0" checked={checked} onChange={onToggle} />
        <div className="grid flex-1 grid-cols-[1fr_auto_auto] items-center gap-3 overflow-hidden">{children}</div>
      </label>
      {category && <div className="mt-1.5 pl-7">{category}</div>}
    </div>
  )
}
