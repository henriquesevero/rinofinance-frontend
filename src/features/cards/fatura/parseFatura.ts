import { detectBrand } from "./brands"

export interface ParsedInstallment {
  name: string
  installmentAmount: number
  totalInstallments: number
  currentInstallment: number
  firstInstallmentDate: string // YYYY-MM-01
  domain: string
  isSingle: boolean // true for one-off ("avulsa") purchases (1x)
}

export interface ParsedSubscription {
  name: string
  monthlyAmount: number
  domain: string
}

// A line that was recognized as money movement but deliberately left out
// of the import (payment, previous invoice, IOF, dollar conversion) or that
// couldn't be confidently parsed — surfaced so the user knows what was
// skipped.
export interface SkippedLine {
  description: string
  amount: number | null
  reason: string
}

export interface ParsedFatura {
  referenceMonth: string // YYYY-MM
  installmentPurchases: ParsedInstallment[]
  subscriptions: ParsedSubscription[]
  notImported: SkippedLine[]
}

// Structural totals and payments that are never real charges — always
// skipped. IOF and currency conversion are intentionally NOT here: the user
// wants those imported (as one-off items) so they can review/uncheck them.
const SKIP_KEYWORDS = [
  "pagamento efetuado",
  "total ",
  "total da fatura",
  "saldo",
  "retirada no exterior",
  "encargos e serviços",
]

// A transaction line looks like: "04 / mai Sympla*rogerio Can03/05 R$ 57,14".
// Capture the leading date and the trailing "R$ value"; everything between
// is the description.
const TRANSACTION_RE = /^(\d{1,2})\s*\/\s*([a-zç]{3})\s+(.+?)\s+R\$\s*([\d.,]+)\s*$/i
// Installment marker at the end of a description: "03/05" or "03 / 05".
const INSTALLMENT_RE = /\s*(\d{2})\s*\/\s*(\d{2})\s*$/
// Due date: "venc. da fatura 01/08/2026".
const DUE_DATE_RE = /venc\S*\s*da\s*fatura\s*(\d{2})\/(\d{2})\/(\d{4})/i
// A dateless line still carrying an "R$ value" — e.g. an international
// purchase listed under a conversion line.
const DATELESS_VALUE_RE = /^(.+?)\s+R\$\s*([\d.,]+)\s*$/i
// Section headers / totals that are structural, never purchases.
const STRUCTURAL_RE = /total|lançamentos|fatura|venc|melhor data|emitido|agência|conta corrente|saldo/i

// Human-readable reason for why a recognized line was left out.
function skipReason(description: string): string {
  const lower = description.toLowerCase()
  if (lower.includes("pagamento")) return "Pagamento da fatura"
  if (lower.includes("fatura anterior")) return "Fatura anterior"
  if (lower.includes("iof")) return "IOF"
  if (lower.includes("dólar de conversão") || lower.includes("dolar de conversao")) return "Conversão de dólar"
  if (lower.includes("valor em dólar") || lower.includes("valor em dolar")) return "Conversão de dólar"
  if (lower.includes("retirada no exterior")) return "Retirada no exterior"
  if (lower.includes("encargos")) return "Encargos e serviços"
  return "Ignorado"
}

export function parseBrazilianAmount(raw: string): number {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".")
  return Number(normalized)
}

// Subtracts `months` from a "YYYY-MM" and returns "YYYY-MM-01".
export function monthMinus(referenceMonth: string, months: number): string {
  const [year, month] = referenceMonth.split("-").map(Number)
  const zeroBased = month - 1 - months
  const date = new Date(year, zeroBased, 1)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}-01`
}

// Extracts the invoice's purchase-cycle reference month ("YYYY-MM"),
// falling back to the current month when it can't be found. An invoice due
// on the 1st of month M bills the purchases made in the previous cycle, and
// the app totals cards by that cycle month — so we shift one month back from
// the due date (e.g. venc 01/08 → cycle 2026-07). This keeps imported items
// showing in the right month and the installment counts correct.
export function extractReferenceMonth(lines: string[]): string {
  for (const line of lines) {
    const m = line.match(DUE_DATE_RE)
    if (m) {
      const d = new Date(Number(m[3]), Number(m[2]) - 1 - 1, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    }
  }
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function shouldSkip(description: string): boolean {
  const lower = description.toLowerCase()
  return SKIP_KEYWORDS.some((k) => lower.includes(k))
}

// Classifies a purchase line (already stripped of date/skip noise) into an
// installment, a subscription, or a one-off ("avulsa") purchase, pushing it
// onto the right bucket. Shared by dated lines and dateless ones (e.g.
// international charges listed under a conversion line).
function classifyLine(
  description: string,
  amount: number,
  referenceMonth: string,
  installmentPurchases: ParsedInstallment[],
  subscriptions: ParsedSubscription[]
): void {
  const brand = detectBrand(description)
  const installmentMatch = description.match(INSTALLMENT_RE)

  if (installmentMatch) {
    const current = Number(installmentMatch[1])
    const total = Number(installmentMatch[2])
    const name = description.replace(INSTALLMENT_RE, "").trim()
    if (!name || total < 1 || current < 1) return
    installmentPurchases.push({
      name,
      installmentAmount: amount,
      totalInstallments: total,
      currentInstallment: current,
      firstInstallmentDate: monthMinus(referenceMonth, current - 1),
      domain: brand?.domain ?? "",
      isSingle: false,
    })
    return
  }

  if (brand?.recurring) {
    subscriptions.push({ name: brand.label, monthlyAmount: amount, domain: brand.domain })
    return
  }

  installmentPurchases.push({
    name: description,
    installmentAmount: amount,
    totalInstallments: 1,
    currentInstallment: 1,
    firstInstallmentDate: `${referenceMonth}-01`,
    domain: brand?.domain ?? "",
    isSingle: true,
  })
}

// Parses reconstructed statement text lines into classified purchases and
// subscriptions. Installment purchases (with an NN/MM marker) win over
// subscription detection; a recurring known service without a marker
// becomes a subscription; anything else becomes a one-off (1x) purchase.
export function parseFaturaLines(lines: string[]): ParsedFatura {
  const referenceMonth = extractReferenceMonth(lines)
  const installmentPurchases: ParsedInstallment[] = []
  const subscriptions: ParsedSubscription[] = []
  const notImported: SkippedLine[] = []

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, " ").trim()
    const match = line.match(TRANSACTION_RE)

    // Dateless lines: capture real-looking purchases that couldn't be
    // parsed (e.g. international entries) as "not imported"; ignore
    // structural/zero-value noise.
    if (!match) {
      const dateless = line.match(DATELESS_VALUE_RE)
      if (dateless) {
        const desc = dateless[1].trim()
        const value = parseBrazilianAmount(dateless[2])
        if (value > 0 && !STRUCTURAL_RE.test(desc)) {
          if (shouldSkip(desc)) {
            notImported.push({ description: desc, amount: value, reason: skipReason(desc) })
          } else {
            // A real purchase listed without a leading date (e.g. an
            // international charge shown under a conversion line) — import it.
            classifyLine(desc, value, referenceMonth, installmentPurchases, subscriptions)
          }
        }
      }
      continue
    }

    const description = match[3].trim()
    const amount = parseBrazilianAmount(match[4])
    if (shouldSkip(description)) {
      notImported.push({ description, amount: Number.isFinite(amount) ? amount : null, reason: skipReason(description) })
      continue
    }
    if (!Number.isFinite(amount) || amount <= 0) continue

    classifyLine(description, amount, referenceMonth, installmentPurchases, subscriptions)
  }

  return { referenceMonth, installmentPurchases, subscriptions, notImported }
}
