export interface Asset {
  id: string
  name: string
  currentBalance: number
  active: boolean
}

export interface AssetsOverview {
  assets: Asset[]
  totalPatrimony: number
}
