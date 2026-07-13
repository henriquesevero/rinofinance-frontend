// Maps merchant keywords found in a statement line to a brand: a display
// label, a domain for the logo.dev logo, and whether the charge is a
// recurring service (subscription) vs a one-off purchase. Matching is a
// case-insensitive substring test against the raw description.
interface Brand {
  keyword: string
  label: string
  domain: string
  recurring: boolean
}

const BRANDS: Brand[] = [
  // Recurring services -> imported as subscriptions
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

  // Known brands (one-off) -> just for the logo
  { keyword: "uber", label: "Uber", domain: "uber.com", recurring: false },
  { keyword: "ifd*", label: "iFood", domain: "ifood.com.br", recurring: false },
  { keyword: "ifood", label: "iFood", domain: "ifood.com.br", recurring: false },
  { keyword: "99app", label: "99", domain: "99app.com", recurring: false },
  { keyword: "99food", label: "99", domain: "99app.com", recurring: false },
  { keyword: "paypal", label: "PayPal", domain: "paypal.com", recurring: false },
  { keyword: "decolar", label: "Decolar", domain: "decolar.com", recurring: false },
  { keyword: "renner", label: "Lojas Renner", domain: "lojasrenner.com.br", recurring: false },
  { keyword: "drogasil", label: "Drogasil", domain: "drogasil.com.br", recurring: false },
  { keyword: "vivara", label: "Vivara", domain: "vivara.com.br", recurring: false },
  { keyword: "godaddy", label: "GoDaddy", domain: "godaddy.com", recurring: false },
  { keyword: "sympla", label: "Sympla", domain: "sympla.com.br", recurring: false },
  { keyword: "alura", label: "Alura", domain: "alura.com.br", recurring: false },
  { keyword: "playstation", label: "PlayStation", domain: "playstation.com", recurring: false },
  { keyword: "porto seguro", label: "Porto Seguro", domain: "portoseguro.com.br", recurring: false },
]

// Returns the first brand whose keyword appears in the description, or null.
export function detectBrand(description: string): Brand | null {
  const haystack = description.toLowerCase()
  return BRANDS.find((b) => haystack.includes(b.keyword)) ?? null
}
