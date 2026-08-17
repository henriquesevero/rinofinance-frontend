import * as XLSX from "xlsx"
import { currentInstallment, installmentEndLabel } from "./installments"
import { isPurchaseActiveInMonth, isSubscriptionActiveInMonth } from "./cardStats"
import type { CardOverview } from "./types"

function formatDateBR(dateStr?: string): string {
  if (!dateStr) return ""
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m) return ""
  return `${String(d || 1).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`
}

function setColWidths(sheet: XLSX.WorkSheet, widths: number[]) {
  sheet["!cols"] = widths.map((wch) => ({ wch }))
}

export function exportCardToXlsx(card: CardOverview, month: string, categoryName: (id?: string) => string) {
  const active = card.installmentPurchases.filter((p) => isPurchaseActiveInMonth(p, month))
  const avulsas = active.filter((p) => p.totalInstallments === 1)
  const parceladas = active.filter((p) => p.totalInstallments > 1)
  const subscriptions = card.subscriptions.filter((s) => isSubscriptionActiveInMonth(s, month))

  const wb = XLSX.utils.book_new()

  const avulsasSheet = XLSX.utils.json_to_sheet(
    avulsas.map((p) => ({
      Item: p.name,
      Categoria: categoryName(p.categoryId),
      Valor: p.installmentAmount,
      Data: formatDateBR(p.firstInstallmentDate),
    }))
  )
  setColWidths(avulsasSheet, [32, 20, 14, 14])
  XLSX.utils.book_append_sheet(wb, avulsasSheet, "Compras avulsas")

  const parceladasSheet = XLSX.utils.json_to_sheet(
    parceladas.map((p) => ({
      Item: p.name,
      Categoria: categoryName(p.categoryId),
      "Parcelas pagas": currentInstallment(p) - 1,
      "Parcelas restantes": p.remainingInstallments,
      "Total de parcelas": p.totalInstallments,
      "Valor da parcela": p.installmentAmount,
      "Valor total restante": p.remainingTotal,
      "Termina em": installmentEndLabel(p),
    }))
  )
  setColWidths(parceladasSheet, [32, 20, 14, 16, 16, 16, 18, 14])
  XLSX.utils.book_append_sheet(wb, parceladasSheet, "Compras parceladas")

  const subscriptionsSheet = XLSX.utils.json_to_sheet(
    subscriptions.map((s) => ({
      Item: s.name,
      Categoria: categoryName(s.categoryId),
      "Valor mensal": s.monthlyAmount,
    }))
  )
  setColWidths(subscriptionsSheet, [32, 20, 14])
  XLSX.utils.book_append_sheet(wb, subscriptionsSheet, "Assinaturas")

  const fileName = `${card.name.replace(/[^\p{L}\p{N}]+/gu, "_")}_${month}.xlsx`
  XLSX.writeFile(wb, fileName)
}
