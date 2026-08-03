export interface Asset {
  id: string
  name: string
  ticker: string
  class: string
  quantity: number
  avgPrice: number
  currentPrice: number
  investedAmount: number
  currentBalance: number
  active: boolean
}

export interface Provento {
  id: string
  assetId: string
  amount: number
  date: string
}

export interface AssetsOverview {
  assets: Asset[]
  proventos: Provento[]
  totalPatrimony: number
  totalInvested: number
  totalProventos: number
}

export interface AssetInput {
  name: string
  ticker: string
  class: string
  quantity: number
  avgPrice: number
  currentPrice: number
  investedAmount: number
  currentBalance: number
}

export function profit(currentBalance: number, invested: number): number {
  return currentBalance - invested
}
export function profitPct(currentBalance: number, invested: number): number | null {
  return invested > 0 ? ((currentBalance - invested) / invested) * 100 : null
}
