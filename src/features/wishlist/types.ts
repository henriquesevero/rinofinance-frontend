export interface WishlistSection {
  id: string
  name: string
}

export interface WishlistItem {
  id: string
  sectionId?: string
  name: string
  url?: string
  price: number
  imageUrl?: string
}

export interface WishlistOverview {
  sections: WishlistSection[]
  items: WishlistItem[]
  total: number
}

export interface SectionInput {
  name: string
}

export interface ItemInput {
  name: string
  url: string
  price: number
  imageUrl: string
  sectionId: string
}

export interface UnfurlResult {
  imageUrl: string
  title: string
  price: string
}
