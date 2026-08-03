interface Brand {
  keyword: string
  label: string
  domain: string
  recurring: boolean
}

const BRANDS: Brand[] = [
  { keyword: "netflix", label: "Netflix", domain: "netflix.com", recurring: true },
  { keyword: "spotify", label: "Spotify", domain: "spotify.com", recurring: true },
  { keyword: "apple.com", label: "Apple", domain: "apple.com", recurring: true },
  { keyword: "disney", label: "Disney+", domain: "disneyplus.com", recurring: true },
  { keyword: "hbo", label: "Max", domain: "max.com", recurring: true },
  { keyword: "amazon prime", label: "Amazon Prime", domain: "primevideo.com", recurring: true },
  { keyword: "prime video", label: "Amazon Prime", domain: "primevideo.com", recurring: true },
  { keyword: "youtube", label: "YouTube Premium", domain: "youtube.com", recurring: true },
  { keyword: "totalpass", label: "TotalPass", domain: "totalpass.com", recurring: true },
  { keyword: "gympass", label: "Gympass", domain: "gympass.com", recurring: true },
  { keyword: "anthropic", label: "Claude", domain: "claude.ai", recurring: true },
  { keyword: "claude", label: "Claude", domain: "claude.ai", recurring: true },
  { keyword: "openai", label: "ChatGPT", domain: "openai.com", recurring: true },
  { keyword: "*googl", label: "Google", domain: "google.com", recurring: true },

  { keyword: "uber", label: "Uber", domain: "uber.com", recurring: false },
  { keyword: "ifd*", label: "iFood", domain: "ifood.com.br", recurring: false },
  { keyword: "ifood", label: "iFood", domain: "ifood.com.br", recurring: false },
  { keyword: "99app", label: "99", domain: "99app.com", recurring: false },
  { keyword: "99food", label: "99", domain: "99app.com", recurring: false },
  { keyword: "99*", label: "99", domain: "99app.com", recurring: false },
  { keyword: "paypal", label: "PayPal", domain: "paypal.com", recurring: false },
  { keyword: "decolar", label: "Decolar", domain: "decolar.com", recurring: false },
  { keyword: "renner", label: "Lojas Renner", domain: "lojasrenner.com.br", recurring: false },
  { keyword: "riachuelo", label: "Riachuelo", domain: "riachuelo.com.br", recurring: false },
  { keyword: "drogasil", label: "Drogasil", domain: "drogasil.com.br", recurring: false },
  { keyword: "vivara", label: "Vivara", domain: "vivara.com.br", recurring: false },
  { keyword: "godaddy", label: "GoDaddy", domain: "godaddy.com", recurring: false },
  { keyword: "sympla", label: "Sympla", domain: "sympla.com.br", recurring: false },
  { keyword: "alura", label: "Alura", domain: "alura.com.br", recurring: false },
  { keyword: "linuxtips", label: "LinuxTips", domain: "linuxtips.com.br", recurring: false },
  { keyword: "playstation", label: "PlayStation", domain: "playstation.com", recurring: false },
  { keyword: "playstatio", label: "PlayStation", domain: "playstation.com", recurring: false },
  { keyword: "mercadoliv", label: "Mercado Livre", domain: "mercadolivre.com.br", recurring: false },
  { keyword: "mercado livre", label: "Mercado Livre", domain: "mercadolivre.com.br", recurring: false },
  { keyword: "magalu", label: "Magazine Luiza", domain: "magazineluiza.com.br", recurring: false },
  { keyword: "magazine luiza", label: "Magazine Luiza", domain: "magazineluiza.com.br", recurring: false },
  { keyword: "americanas", label: "Americanas", domain: "americanas.com.br", recurring: false },
  { keyword: "shopee", label: "Shopee", domain: "shopee.com.br", recurring: false },
  { keyword: "aliexpress", label: "AliExpress", domain: "aliexpress.com", recurring: false },
  { keyword: "amazon", label: "Amazon", domain: "amazon.com.br", recurring: false },
  { keyword: "shein", label: "Shein", domain: "shein.com", recurring: false },
  { keyword: "centauro", label: "Centauro", domain: "centauro.com.br", recurring: false },
  { keyword: "nike", label: "Nike", domain: "nike.com.br", recurring: false },
  { keyword: "adidas", label: "Adidas", domain: "adidas.com.br", recurring: false },
  { keyword: "leroy", label: "Leroy Merlin", domain: "leroymerlin.com.br", recurring: false },
  { keyword: "steam", label: "Steam", domain: "steampowered.com", recurring: false },
  { keyword: "porto seguro", label: "Porto Seguro", domain: "portoseguro.com.br", recurring: false },
]

const ACQUIRER_PREFIX_RE = /^[a-z0-9&]{1,5}\s*\*+\s*/

export function detectBrand(description: string): Brand | null {
  const haystack = description.toLowerCase()
  return BRANDS.find((b) => haystack.includes(b.keyword)) ?? null
}

export function logoDomain(name: string, storedDomain?: string): string {
  const stored = storedDomain?.trim()
  if (stored) return stored
  const brand = detectBrand(name)
  if (brand) return brand.domain
  const cleaned = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(ACQUIRER_PREFIX_RE, "")
  const first = cleaned.match(/[a-z][a-z0-9]{2,}/)?.[0]
  return first ? `${first}.com` : ""
}
