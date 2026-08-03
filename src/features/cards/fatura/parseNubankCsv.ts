import { detectBrand } from "./brands"
import {
  monthMinus,
  parseBrazilianAmount,
  type ParsedFatura,
  type ParsedInstallment,
  type ParsedSubscription,
  type SkippedLine,
} from "./parseFatura"

const INSTALLMENT_RE = /\s*-\s*Parcela\s+(\d+)\s*\/\s*(\d+)\s*$/i

function splitCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current)
      current = ""
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields.map((f) => f.trim())
}

function skipReason(title: string, amount: number): string {
  const lower = title.toLowerCase()
  if (amount < 0 || lower.includes("pagamento")) return "Pagamento/crédito"
  if (lower.includes("estorno")) return "Estorno"
  if (lower.includes("iof")) return "IOF"
  if (lower.includes("anuidade")) return "Anuidade"
  if (lower.includes("juros") || lower.includes("encargos") || lower.includes("multa")) return "Encargos"
  return "Ignorado"
}

function shouldSkip(title: string, amount: number): boolean {
  const lower = title.toLowerCase()
  return (
    amount < 0 ||
    lower.includes("pagamento") ||
    lower.includes("estorno") ||
    lower.includes("iof") ||
    lower.includes("anuidade") ||
    lower.includes("juros") ||
    lower.includes("encargos") ||
    lower.includes("multa")
  )
}

export function parseNubankCsv(text: string, referenceMonth: string): ParsedFatura {
  const rows = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (rows.length > 0 && /^date\s*,\s*title\s*,\s*amount/i.test(rows[0])) {
    rows.shift()
  }

  type Entry = { date: string; title: string; amount: number }
  const entries: Entry[] = []
  const notImported: SkippedLine[] = []

  for (const row of rows) {
    const fields = splitCsvLine(row)
    if (fields.length < 3) continue
    const [date, title, rawAmount] = fields
    if (!title) continue
    const amount = parseBrazilianAmount(rawAmount.replace(/\s/g, ""))
    if (!Number.isFinite(amount)) continue

    if (shouldSkip(title, amount)) {
      notImported.push({ description: title, amount, reason: skipReason(title, amount) })
      continue
    }
    if (amount <= 0) continue
    entries.push({ date, title, amount })
  }

  const reference = referenceMonth || currentMonth()

  const installmentPurchases: ParsedInstallment[] = []
  const subscriptions: ParsedSubscription[] = []

  for (const entry of entries) {
    const brand = detectBrand(entry.title)
    const installmentMatch = entry.title.match(INSTALLMENT_RE)

    if (installmentMatch) {
      const current = Number(installmentMatch[1])
      const total = Number(installmentMatch[2])
      const name = entry.title.replace(INSTALLMENT_RE, "").trim()
      if (!name || total < 1 || current < 1) continue
      installmentPurchases.push({
        name,
        installmentAmount: entry.amount,
        totalInstallments: total,
        currentInstallment: current,
        firstInstallmentDate: monthMinus(reference, current - 1),
        domain: brand?.domain ?? "",
        isSingle: false,
      })
      continue
    }

    if (brand?.recurring) {
      subscriptions.push({ name: brand.label, monthlyAmount: entry.amount, domain: brand.domain })
      continue
    }

    installmentPurchases.push({
      name: entry.title,
      installmentAmount: entry.amount,
      totalInstallments: 1,
      currentInstallment: 1,
      firstInstallmentDate: `${reference}-01`,
      domain: brand?.domain ?? "",
      isSingle: true,
    })
  }

  return { referenceMonth: reference, installmentPurchases, subscriptions, notImported }
}

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}
