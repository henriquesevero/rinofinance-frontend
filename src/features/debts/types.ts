export type DebtKind = "veiculo" | "consignado" | "outro"
export type PaymentKind = "regular" | "antecipada"

export interface DebtPayment {
  number: number
  kind: PaymentKind
  amount: number
  paidAt: string
}

export interface Debt {
  id: string
  name: string
  kind: DebtKind
  institution: string
  financedAmount: number
  installmentAmount: number
  totalInstallments: number
  firstDueDate: string
  monthlyRate: number
  payments: DebtPayment[]
}

export interface DebtInput {
  name: string
  kind: DebtKind
  institution: string
  financedAmount: number
  installmentAmount: number
  totalInstallments: number
  firstDueDate: string
  monthlyRate: number
  alreadyPaid: number
}

export interface RegisterPaymentsInput {
  kind: PaymentKind
  paidAt: string
  items: { number: number; amount: number }[]
}

export const DEBT_KINDS: { value: DebtKind; label: string }[] = [
  { value: "veiculo", label: "Veículo (CDC)" },
  { value: "consignado", label: "Consignado" },
  { value: "outro", label: "Outro" },
]
