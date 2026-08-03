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

// Annual view: the whole year computed server-side in one request, with both
// "realized" (received/paid) and "planned" (all active) figures precomputed so
// switching modes needs no refetch.
export interface AnnualMonthSummary {
  index: number
  incomeRealized: number
  incomePlanned: number
  expenseRealized: number
  expensePlanned: number
}

export interface AnnualCategorySummary {
  id: string
  total: number
}

export interface AnnualSummary {
  year: number
  months: AnnualMonthSummary[]
  expenseCategoriesRealized: AnnualCategorySummary[]
  expenseCategoriesPlanned: AnnualCategorySummary[]
  incomeCategoriesRealized: AnnualCategorySummary[]
  incomeCategoriesPlanned: AnnualCategorySummary[]
}
