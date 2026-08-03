export interface AccountPurchase {
  id: string
  name: string
  amount: number
  date: string
  categoryId?: string
}

export interface Account {
  id: string
  name: string
  color?: string
  imageUrl?: string
  balance: number
  monthlyDebitTotal: number
  purchases: AccountPurchase[]
}

export interface AccountsOverview {
  accounts: Account[]
  totalBalance: number
}

export interface AccountInput {
  name: string
  color: string
  imageUrl: string
  balance: number
}

export interface AccountPurchaseInput {
  name: string
  amount: number
  date: string
  categoryId: string
}
