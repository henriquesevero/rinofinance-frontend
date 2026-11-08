import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Banknote, Car, Check, HandCoins, Hourglass, Landmark, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { MoneyValue } from "@/components/MoneyValue"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { toErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import {
  annualRate,
  buildSchedule,
  contractRate,
  durationLabel,
  formatPct,
  monthYear,
  payoffScenarios,
  shortDate,
  summarize,
  todayISO,
  type Installment,
} from "./amortization"
import { AnticipationSimulator } from "./components/AnticipationSimulator"
import { DebtFormDialog } from "./components/DebtFormDialog"
import { InstallmentsPanel } from "./components/InstallmentsPanel"
import { RegisterAnticipationDialog } from "./components/RegisterAnticipationDialog"
import { useDebtsStore } from "./store"
import type { Debt, DebtKind } from "./types"

type FormState = { mode: "create" } | { mode: "edit"; debt: Debt } | null

const KIND_ICON: Record<DebtKind, typeof Car> = { veiculo: Car, consignado: Banknote, outro: Landmark }

export function DebtsPage() {
  const debts = useDebtsStore((s) => s.debts)
  const isLoading = useDebtsStore((s) => s.isLoading)
  const error = useDebtsStore((s) => s.error)
  const fetchDebts = useDebtsStore((s) => s.fetchDebts)
  const createDebt = useDebtsStore((s) => s.createDebt)
  const updateDebt = useDebtsStore((s) => s.updateDebt)
  const deleteDebt = useDebtsStore((s) => s.deleteDebt)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<Debt | null>(null)

  useEffect(() => {
    fetchDebts()
  }, [fetchDebts])

  const selected = debts.find((d) => d.id === selectedId) ?? debts[0]

  if (isLoading && debts.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Carregando dívidas...
      </div>
    )
  }

  if (error && debts.length === 0) {
    return <p className="text-center text-destructive">{error}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dívidas</h1>
          <p className="hidden text-muted-foreground sm:block">Até quando vai, quanto falta e quando vale antecipar.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ValuesVisibilityToggle />
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => setFormState({ mode: "create" })}
            aria-label="Novo contrato"
            title="Novo contrato"
          >
            <Plus className="size-5" />
          </Button>
        </div>
      </div>

      {selected ? (
        <>
          {debts.length > 1 && (
            <div className="scrollbar-hide flex gap-2 overflow-x-auto" data-swipe-ignore>
              {debts.map((debt) => {
                const Icon = KIND_ICON[debt.kind]
                return (
                  <button
                    key={debt.id}
                    type="button"
                    onClick={() => setSelectedId(debt.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      debt.id === selected.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    {debt.name}
                  </button>
                )
              })}
            </div>
          )}
          <DebtOverview
            key={selected.id}
            debt={selected}
            onEdit={() => setFormState({ mode: "edit", debt: selected })}
            onDelete={() => setDeleting(selected)}
          />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HandCoins className="size-6" />
          </span>
          <p className="max-w-sm text-sm text-muted-foreground">
            Cadastre seu financiamento para ver o fim das parcelas, o valor de quitação e quanto economiza antecipando.
          </p>
          <Button variant="outline" size="sm" onClick={() => setFormState({ mode: "create" })}>
            <Plus className="size-4" />
            Cadastrar contrato
          </Button>
        </div>
      )}

      <DebtFormDialog
        open={formState !== null}
        onOpenChange={(open) => !open && setFormState(null)}
        debt={formState?.mode === "edit" ? formState.debt : undefined}
        onSubmit={async (input) => {
          if (formState?.mode === "edit") {
            await updateDebt(formState.debt.id, input)
            toast.success("Contrato atualizado")
          } else {
            await createDebt(input)
            toast.success("Contrato cadastrado")
          }
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir contrato?"
        description={`"${deleting?.name}" e todo o histórico de pagamentos serão removidos.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!deleting) return
          try {
            await deleteDebt(deleting.id)
            toast.success("Contrato excluído")
          } catch (err) {
            toast.error(toErrorMessage(err))
          }
        }}
      />
    </div>
  )
}

function DebtOverview({ debt, onEdit, onDelete }: { debt: Debt; onEdit: () => void; onDelete: () => void }) {
  const registerPayments = useDebtsStore((s) => s.registerPayments)
  const removePayment = useDebtsStore((s) => s.removePayment)
  const [anticipating, setAnticipating] = useState<Installment[] | null>(null)

  const today = useMemo(todayISO, [])
  const rate = useMemo(() => contractRate(debt), [debt])
  const schedule = useMemo(() => buildSchedule(debt, rate, today), [debt, rate, today])
  const summary = useMemo(() => summarize(debt, schedule), [debt, schedule])
  const scenarios = useMemo(() => payoffScenarios(summary.pending, rate, today), [summary.pending, rate, today])

  const { pending, open, overdue } = summary
  const settled = pending.length === 0
  const nextInstallment = overdue[0] ?? open[0]
  const discountPct = summary.remainingNominal > 0 ? summary.payoffSaving / summary.remainingNominal : 0
  const Icon = KIND_ICON[debt.kind]

  async function handleMarkPaid(item: Installment) {
    try {
      await registerPayments(debt.id, {
        kind: "regular",
        paidAt: `${todayISO()}T00:00:00Z`,
        items: [{ number: item.number, amount: item.amount }],
      })
      toast.success(`Parcela ${item.number} marcada como paga`)
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  async function handleUndo(item: Installment) {
    try {
      await removePayment(debt.id, item.number)
      toast.success(`Pagamento da parcela ${item.number} desfeito`)
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{debt.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[debt.institution, rate > 0 ? `${formatPct(rate)} a.m. · ${formatPct(annualRate(rate), 1)} a.a.` : null]
              .filter(Boolean)
              .join(" · ")}
            {debt.monthlyRate <= 0 && rate > 0 && " (implícita)"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="size-9 text-muted-foreground" aria-label="Ações do contrato">
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" />
              Editar contrato
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="size-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          <Cell label="Falta pagar" sub={`${pending.length} de ${debt.totalInstallments} parcelas`}>
            <MoneyValue value={summary.remainingNominal} className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl" />
          </Cell>
          <Cell label="Quitar hoje" sub={settled ? undefined : `estimativa · −${formatPct(discountPct, 1)}`}>
            <MoneyValue value={summary.payoffToday} className="text-xl font-bold tracking-tight tabular-nums text-emerald-500 sm:text-2xl" />
          </Cell>
          <Cell label="Última parcela" sub={settled ? undefined : `faltam ${durationLabel(pending.length)}`}>
            <span className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
              {summary.lastDueDate ? monthYear(summary.lastDueDate) : "Quitado"}
            </span>
          </Cell>
          <Cell label="Economia já realizada" sub={summary.anticipatedCount > 0 ? `${summary.anticipatedCount} antecipadas` : "nenhuma antecipação"}>
            <MoneyValue value={summary.realizedSaving} className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl" />
          </Cell>
        </div>
      </Card>

      <ProgressBar total={debt.totalInstallments} paid={summary.paidCount} anticipated={summary.anticipatedCount} />

      {nextInstallment && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border p-3",
            overdue.length > 0 && "border-destructive/40 bg-destructive/5"
          )}
        >
          {overdue.length > 0 ? (
            <AlertTriangle className="size-4 shrink-0 text-destructive" />
          ) : (
            <Hourglass className="size-4 shrink-0 text-muted-foreground" />
          )}
          <p className="min-w-0 flex-1 text-sm">
            {overdue.length > 0 ? (
              <>
                <span className="font-semibold">
                  {overdue.length === 1 ? "1 parcela vencida" : `${overdue.length} parcelas vencidas`}.
                </span>{" "}
                <span className="text-muted-foreground">
                  A parcela {nextInstallment.number} venceu em {shortDate(nextInstallment.dueDate)}. Se já pagou, confirme aqui.
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold">Próxima: parcela {nextInstallment.number}</span>{" "}
                <span className="text-muted-foreground">
                  em {shortDate(nextInstallment.dueDate)} · <MoneyValue value={nextInstallment.amount} className="tabular-nums" />
                </span>
              </>
            )}
          </p>
          <Button size="sm" variant="outline" className="shrink-0" onClick={() => handleMarkPaid(nextInstallment)}>
            <Check className="size-4" />
            Paguei
          </Button>
        </div>
      )}

      {open.some((i) => i.daysUntilDue > 0) && (
        <AnticipationSimulator open={open} rate={rate} today={today} onRegister={setAnticipating} />
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {scenarios.length > 1 && (
          <Card className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Hourglass className="size-4 shrink-0 text-primary" />
              <h2 className="text-sm font-semibold">Quanto custa esperar para quitar</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="pb-1.5 pr-2 font-semibold">Quitar em</th>
                    <th className="pb-1.5 pr-2 text-right font-semibold">Quitação</th>
                    <th className="pb-1.5 pr-2 text-right font-semibold">Custo total</th>
                    <th className="pb-1.5 text-right font-semibold">A mais</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((s) => (
                    <tr key={s.monthsAhead} className="border-b border-border/50 last:border-0">
                      <td className="whitespace-nowrap py-2 pr-2 font-medium">
                        {s.monthsAhead === 0 ? "Hoje" : monthYear(s.date)}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <MoneyValue value={s.settlement} className="tabular-nums" />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <MoneyValue value={s.total} className="font-semibold tabular-nums" />
                      </td>
                      <td className="py-2 text-right">
                        {s.monthsAhead === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <MoneyValue value={s.extraVersusToday} className="tabular-nums text-rose-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Custo total soma as parcelas pagas até a data e o boleto de quitação naquele dia.
            </p>
          </Card>
        )}

        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Landmark className="size-4 shrink-0 text-primary" />
            <h2 className="text-sm font-semibold">Raio-x do contrato</h2>
          </div>
          <dl className="flex flex-col gap-2 text-sm">
            <Fact label="Valor financiado" value={debt.financedAmount} />
            <Fact label="Total das parcelas" value={summary.contractTotal} />
            <Fact label="Juros do contrato" value={summary.contractInterest} />
            <Fact label="Já desembolsado" value={summary.totalPaid} />
          </dl>
          <p className="text-xs text-muted-foreground">
            Valores de quitação são estimativas com a taxa do contrato. O valor final é o do boleto emitido pelo banco.
          </p>
        </Card>
      </div>

      <InstallmentsPanel
        schedule={schedule}
        onMarkPaid={handleMarkPaid}
        onAnticipate={(item) => setAnticipating([item])}
        onUndo={handleUndo}
      />

      <RegisterAnticipationDialog
        items={anticipating}
        onOpenChange={(isOpen) => !isOpen && setAnticipating(null)}
        onSubmit={async (input) => {
          await registerPayments(debt.id, input)
          toast.success("Antecipação registrada")
        }}
      />
    </div>
  )
}

function ProgressBar({ total, paid, anticipated }: { total: number; paid: number; anticipated: number }) {
  const remaining = total - paid - anticipated
  const segments = [
    { label: "Pagas", value: paid, color: "bg-emerald-500" },
    { label: "Antecipadas", value: anticipated, color: "bg-primary" },
    { label: "Restantes", value: remaining, color: "bg-muted-foreground/25" },
  ]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2 gap-0.5">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div key={s.label} className={cn("rounded-full", s.color)} style={{ flexGrow: s.value, flexBasis: 0 }} />
          ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", s.color)} />
            {s.label} <span className="font-medium text-foreground tabular-nums">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <MoneyValue value={value} className="font-medium tabular-nums" />
      </dd>
    </div>
  )
}

function Cell({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-center gap-0.5 bg-card p-4 sm:gap-1 sm:p-5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
      {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}
