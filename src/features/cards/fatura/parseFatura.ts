import { detectBrand, logoDomain } from "./brands"

export interface ParsedInstallment {
  name: string
  installmentAmount: number
  totalInstallments: number
  currentInstallment: number
  firstInstallmentDate: string
  domain: string
  isSingle: boolean
}

const MONTH_ABBR: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
}

function cycleDate(day: number, monthAbbr: string, referenceMonth: string): string | null {
  const mn = MONTH_ABBR[monthAbbr.toLowerCase()]
  if (!mn || !day || day < 1 || day > 31) return null
  const [refY, refM] = referenceMonth.split("-").map(Number)
  const year = mn > refM ? refY - 1 : refY
  return `${year}-${String(mn).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function withDay(monthFirst: string, day: string | null): string {
  return day ? `${monthFirst.slice(0, 8)}${day}` : monthFirst
}

export interface ParsedSubscription {
  name: string
  monthlyAmount: number
  domain: string
}

export interface SkippedLine {
  description: string
  amount: number | null
  reason: string
}

export interface ParsedFatura {
  referenceMonth: string
  installmentPurchases: ParsedInstallment[]
  subscriptions: ParsedSubscription[]
  notImported: SkippedLine[]
}

const SKIP_KEYWORDS = [
  "pagamento efetuado",
  "total ",
  "total da fatura",
  "saldo",
  "retirada no exterior",
  "encargos e serviços",
]

const TRANSACTION_RE = /^(\d{1,2})\s*\/\s*([a-zç]{3})\s+(.+?)\s+R\$\s*([\d.,]+)\s*$/i
const INSTALLMENT_RE = /\s*(\d{2})\s*\/\s*(\d{2})\s*$/
const DUE_DATE_RE = /venc\S*\s*da\s*fatura\s*(\d{2})\/(\d{2})\/(\d{4})/i
const DATELESS_VALUE_RE = /^(.+?)\s+R\$\s*([\d.,]+)\s*$/i
const STRUCTURAL_RE = /total|lançamentos|fatura|venc|melhor data|emitido|agência|conta corrente|saldo/i

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

export function monthMinus(referenceMonth: string, months: number): string {
  const [year, month] = referenceMonth.split("-").map(Number)
  const zeroBased = month - 1 - months
  const date = new Date(year, zeroBased, 1)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}-01`
}

export function extractReferenceMonth(lines: string[]): string {
  for (const line of lines) {
    const m = line.match(DUE_DATE_RE)
    if (m) {
      const d = new Date(Number(m[3]), Number(m[2]) - 1, 1)
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

function classifyLine(
  description: string,
  amount: number,
  referenceMonth: string,
  installmentPurchases: ParsedInstallment[],
  subscriptions: ParsedSubscription[],
  purchaseDate: string | null = null
): void {
  const brand = detectBrand(description)
  const installmentMatch = description.match(INSTALLMENT_RE)
  const day = purchaseDate ? purchaseDate.slice(8, 10) : null

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
      firstInstallmentDate: withDay(monthMinus(referenceMonth, current - 1), day),
      domain: logoDomain(name),
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
    firstInstallmentDate: withDay(`${referenceMonth}-01`, day),
    domain: logoDomain(description),
    isSingle: true,
  })
}

export function parseFaturaLines(lines: string[]): ParsedFatura {
  const referenceMonth = extractReferenceMonth(lines)
  const installmentPurchases: ParsedInstallment[] = []
  const subscriptions: ParsedSubscription[] = []
  const notImported: SkippedLine[] = []

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, " ").trim()
    const match = line.match(TRANSACTION_RE)

    if (!match) {
      const dateless = line.match(DATELESS_VALUE_RE)
      if (dateless) {
        const desc = dateless[1].trim()
        const value = parseBrazilianAmount(dateless[2])
        if (value > 0 && !STRUCTURAL_RE.test(desc)) {
          if (shouldSkip(desc)) {
            notImported.push({ description: desc, amount: value, reason: skipReason(desc) })
          } else {
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

    const purchaseDate = cycleDate(Number(match[1]), match[2], referenceMonth)
    classifyLine(description, amount, referenceMonth, installmentPurchases, subscriptions, purchaseDate)
  }

  return { referenceMonth, installmentPurchases, subscriptions, notImported }
}
