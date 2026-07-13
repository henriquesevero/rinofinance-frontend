export interface InstallmentPurchase {
  id: string
  name: string
  installmentAmount: number
  totalInstallments: number
  firstInstallmentDate: string
  remainingInstallments: number
  remainingTotal: number
  domain?: string
  flagged: boolean
  categoryId?: string
}

export interface Subscription {
  id: string
  name: string
  monthlyAmount: number
  domain?: string
  categoryId?: string
}

export interface CardOverview {
  id: string
  name: string
  color?: string
  logoUrl?: string
  imageUrl?: string
  creditLimit: number
  dueDay?: number
  installmentPurchases: InstallmentPurchase[]
  subscriptions: Subscription[]
  monthlyTotal: number
}

export interface CardsOverview {
  cards: CardOverview[]
  grandTotal: number
}

export interface CardInput {
  name: string
  color: string
  logoUrl: string
  imageUrl: string
  creditLimit: number
  dueDay: number
}

export interface InstallmentPurchaseInput {
  name: string
  installmentAmount: number
  totalInstallments: number
  firstInstallmentDate: string
  domain: string
  categoryId: string
}

export interface SubscriptionInput {
  name: string
  monthlyAmount: number
  domain: string
  categoryId: string
}

export interface ImportFaturaPayload {
  installmentPurchases: InstallmentPurchaseInput[]
  subscriptions: SubscriptionInput[]
}

export interface ImportFaturaResult {
  installmentPurchases: number
  subscriptions: number
}

export interface ClearCardPayload {
  installmentPurchaseIds: string[]
  subscriptionIds: string[]
}

export interface ClearCardResult {
  installmentPurchases: number
  subscriptions: number
}
