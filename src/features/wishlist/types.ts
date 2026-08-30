export interface WishlistSection {
  id: string
  name: string
  color: string
}

export interface WishlistItem {
  id: string
  sectionId?: string
  prioritySectionId?: string
  name: string
  url?: string
  price: number
  imageUrl?: string
  logoUrl?: string
  priority: number
}

export interface WishlistOverview {
  sections: WishlistSection[]
  prioritySections: WishlistSection[]
  items: WishlistItem[]
  total: number
}

export interface SectionInput {
  name: string
  color: string
}

export interface ItemInput {
  name: string
  url: string
  price: number
  imageUrl: string
  logoUrl: string
  sectionId: string
}

export interface UnfurlResult {
  imageUrl: string
  title: string
  price: string
}
