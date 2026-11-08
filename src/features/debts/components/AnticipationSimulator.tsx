import { useMemo, useState } from "react"
import { CalendarCheck, Scale, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoneyInput } from "@/components/MoneyInput"
import { MoneyValue } from "@/components/MoneyValue"
import { cn } from "@/lib/utils"
import {
  annualRate,
  anticipable,
  costOfLast,
  durationLabel,
  formatPct,
  monthYear,
  simulateLump,
  simulateMonthlyPlan,
  type Installment,
} from "../amortization"
import { BalanceChart } from "./BalanceChart"

const YIELD_KEY = "rinofinance:debts-yield"
const DEFAULT_YIELD = "1,00"

function loadYield(): string {
  try {
    return localStorage.getItem(YIELD_KEY) ?? DEFAULT_YIELD
  } catch {
    return DEFAULT_YIELD
  }
}

function saveYield(value: string) {
  try {
    localStorage.setItem(YIELD_KEY, value)
  } catch {
    // Without storage the assumption simply lasts for this visit.
  }
}

type Mode = "lump" | "monthly"

interface AnticipationSimulatorProps {
  open: Installment[]
  rate: number
  today: string
  onRegister: (items: Installment[]) => void
}

export function AnticipationSimulator({ open, rate, today, onRegister }: AnticipationSimulatorProps) {
  const candidates = useMemo(() => anticipable(open), [open])
  const [mode, setMode] = useState<Mode>("lump")
  const [budget, setBudget] = useState(() => Math.ceil(costOfLast(open, Math.min(6, candidates.length)) * 100) / 100)
  const [monthlyExtra, setMonthlyExtra] = useState(500)
  const [yieldInput, setYieldInput] = useState(loadYield)

  const yieldRate = (Number(yieldInput.replace(",", ".")) || 0) / 100
  const lump = useMemo(() => simulateLump(open, budget, rate, yieldRate), [open, budget, rate, yieldRate])
  const plan = useMemo(() => simulateMonthlyPlan(open, monthlyExtra, rate), [open, monthlyExtra, rate])
  const baseline = useMemo(() => simulateMonthlyPlan(open, 0, rate).remainingByStep, [open, rate])

  const dates = open.map((i) => i.dueDate)
  const simulated = mode === "lump" ? lump.remainingByStep : plan.remainingByStep

  function handleCountChange(count: number) {
    setBudget(Math.ceil(costOfLast(open, count) * 100) / 100)
  }

  function handleYieldChange(value: string) {
    setYieldInput(value)
    saveYield(value)
  }

  const count = lump.items.length
  const advantage = lump.saving - lump.investmentGain
  const anticipationWins = rate > yieldRate

  return (
    <Card className="flex flex-col gap-5 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 shrink-0 text-primary" />
        <h2 className="text-sm font-semibold">Simulador de antecipação</h2>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm sm:max-w-xs">
        <ModeButton active={mode === "lump"} onClick={() => setMode("lump")}>
          Valor único
        </ModeButton>
        <ModeButton active={mode === "monthly"} onClick={() => setMode("monthly")}>
          Todo mês
        </ModeButton>
      </div>

      {mode === "lump" ? (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="debt-budget">Quanto você tem para antecipar</Label>
              <MoneyInput id="debt-budget" value={budget} onValueChange={setBudget} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="debt-count">
                Últimas parcelas: {count} de {candidates.length}
              </Label>
              <input
                id="debt-count"
                type="range"
                min={0}
                max={candidates.length}
                value={count}
                onChange={(e) => handleCountChange(Number(e.target.value))}
                className="h-9 w-full accent-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4">
            <Result label="Você paga hoje">
              <MoneyValue value={lump.cost} className="text-lg font-bold tabular-nums" />
            </Result>
            <Result label="Elimina de parcelas">
              <MoneyValue value={lump.nominal} className="text-lg font-bold tabular-nums" />
            </Result>
            <Result label="Economia">
              <MoneyValue value={lump.saving} className="text-lg font-bold tabular-nums text-emerald-500" />
            </Result>
            <Result label="Novo fim">
              <span className="text-lg font-bold tabular-nums">
                {lump.newEndDate ? monthYear(lump.newEndDate) : "Quitado"}
              </span>
              {count > 0 && <span className="text-xs text-muted-foreground">{durationLabel(count)} antes</span>}
            </Result>
          </div>

          {count > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Nas próximas {count} parcelas, o mesmo pedido economizaria só{" "}
                <MoneyValue value={lump.nextInstallmentsSaving} className="font-medium text-foreground tabular-nums" />.
                {lump.leftover >= 0.01 && (
                  <>
                    {" "}
                    Sobram <MoneyValue value={lump.leftover} className="font-medium text-foreground tabular-nums" />.
                  </>
                )}
              </p>
              <Button size="sm" variant="outline" className="shrink-0" onClick={() => onRegister(lump.items)}>
                <CalendarCheck className="size-4" />
                Registrar antecipação
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 sm:max-w-xs">
            <Label htmlFor="debt-extra">Valor extra por mês</Label>
            <MoneyInput id="debt-extra" value={monthlyExtra} onValueChange={setMonthlyExtra} />
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4">
            <Result label="Termina em">
              <span className="text-lg font-bold tabular-nums">{plan.endDate ? monthYear(plan.endDate) : "—"}</span>
            </Result>
            <Result label="Tempo a menos">
              <span className="text-lg font-bold tabular-nums">{durationLabel(plan.monthsSaved)}</span>
            </Result>
            <Result label="Economia">
              <MoneyValue value={plan.saving} className="text-lg font-bold tabular-nums text-emerald-500" />
            </Result>
            <Result label="Total desembolsado">
              <MoneyValue value={plan.totalPaid} className="text-lg font-bold tabular-nums" />
            </Result>
          </div>
        </div>
      )}

      {open.length > 1 && <BalanceChart today={today} dates={dates} baseline={baseline} simulated={simulated} />}

      <div className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex shrink-0 flex-col gap-1.5 sm:w-44">
          <Label htmlFor="debt-yield" className="text-xs">
            Seu dinheiro rende (% a.m. líquido)
          </Label>
          <Input
            id="debt-yield"
            inputMode="decimal"
            value={yieldInput}
            onChange={(e) => handleYieldChange(e.target.value)}
            className="h-8 text-right tabular-nums"
          />
        </div>
        <div className="flex min-w-0 items-start gap-2 text-sm">
          <Scale className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          {rate <= 0 ? (
            <p className="text-muted-foreground">Informe a taxa do contrato para comparar com seus investimentos.</p>
          ) : (
            <p>
              <span className="font-semibold">{anticipationWins ? "Antecipar ganha." : "Investir ganha."}</span>{" "}
              <span className="text-muted-foreground">
                Antecipar rende {formatPct(rate)} a.m. ({formatPct(annualRate(rate), 1)} a.a.) sem risco e sem IR
                {mode === "lump" && count > 0 && (
                  <>
                    ; aplicado, o mesmo valor renderia{" "}
                    <MoneyValue value={lump.investmentGain} className="font-medium text-foreground tabular-nums" /> até os
                    vencimentos, contra{" "}
                    <MoneyValue value={lump.saving} className="font-medium text-foreground tabular-nums" /> de economia (
                    <MoneyValue value={Math.abs(advantage)} className="font-medium text-foreground tabular-nums" />{" "}
                    {advantage >= 0 ? "a favor de antecipar" : "a favor de investir"})
                  </>
                )}
                .
              </span>
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md py-1.5 font-medium transition-colors",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function Result({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 bg-card p-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
