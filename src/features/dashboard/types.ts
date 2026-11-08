export interface Income {
  id: string
  name: string
  amount: number
  active: boolean
  received: boolean
  categoryId?: string
  accountId?: string
}

export interface Expense {
  id: string
  name: string
  amount: number
  active: boolean
  paid: boolean
  cardId?: string
  categoryId?: string
  accountId?: string
}

export interface DashboardSummary {
  incomes: Income[]
  expenses: Expense[]
  totalIncome: number
  totalExpense: number
  netBalance: number
}
