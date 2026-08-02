// Asset classes mirror the backend's `assetClasses` set. Each one carries a
// label, a short plural for headers, an allocation color and whether it's a
// "por cotas" (quantity × price) or "por valor" (single balance) position by
// default — so the form and the portfolio group everything consistently.
export type AssetClass =
  | "acao"
  | "fii"
  | "renda_fixa"
  | "tesouro"
  | "cripto"
  | "fundo"
  | "reserva"
  | "outro"

export interface ClassMeta {
  value: AssetClass
  label: string
  plural: string
  color: string
  // "quotas" → tracked by quantity + preço médio + preço atual (ações, FIIs…).
  // "value"  → tracked by a single invested/current amount (renda fixa, reserva).
  defaultMode: "quotas" | "value"
}

// Display + form order. The first entries are the "por cota" market assets.
export const ASSET_CLASSES: ClassMeta[] = [
  { value: "acao", label: "Ação", plural: "Ações", color: "#3b82f6", defaultMode: "quotas" },
  { value: "fii", label: "FII", plural: "Fundos imobiliários", color: "#8b5cf6", defaultMode: "quotas" },
  { value: "cripto", label: "Cripto", plural: "Criptomoedas", color: "#f59e0b", defaultMode: "quotas" },
  { value: "fundo", label: "Fundo", plural: "Fundos", color: "#ec4899", defaultMode: "value" },
  { value: "renda_fixa", label: "Renda fixa", plural: "Renda fixa", color: "#10b981", defaultMode: "value" },
  { value: "tesouro", label: "Tesouro", plural: "Tesouro Direto", color: "#14b8a6", defaultMode: "value" },
  { value: "reserva", label: "Reserva", plural: "Reserva", color: "#06b6d4", defaultMode: "value" },
  { value: "outro", label: "Outro", plural: "Outros", color: "#9ca3af", defaultMode: "value" },
]

const CLASS_BY_VALUE = new Map(ASSET_CLASSES.map((c) => [c.value, c]))

export function classMeta(value: string): ClassMeta {
  return CLASS_BY_VALUE.get(value as AssetClass) ?? ASSET_CLASSES[ASSET_CLASSES.length - 1]
}
