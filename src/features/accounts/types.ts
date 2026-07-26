export interface AccountPurchase {
  id: string
  name: string
  amount: number
  date: string
  categoryId?: string
  // "debit" (saída) or "credit" (entrada). Synced accounts import both;
  // manually added purchases are debits. Absent is treated as a debit.
  direction?: "debit" | "credit"
}

export interface Account {
  id: string
  name: string
  color?: string
  imageUrl?: string
  // Current balance: debit purchases decrement it; editable at any time.
  balance: number
  // Sum of the current month's debit purchases.
  monthlyDebitTotal: number
  purchases: AccountPurchase[]
}

export interface AccountsOverview {
  accounts: Account[]
  totalBalance: number
}

export interface PluggySyncResult {
  accountsSynced: number
  transactionsImported: number
  transactionsSkipped: number
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
