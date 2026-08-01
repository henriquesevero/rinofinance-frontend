// Shared brand-logo helpers used by merchants (BrandLogo), credit cards and
// bank accounts. Builds the image URL from a domain and resolves a bank's
// domain from its name, so logos appear automatically without manual URLs.

// Brandfetch Logo Link (CDN) client ID. It's a publishable, client-side key
// (it appears in every logo URL), so it's safe to ship a default here; an env
// var can still override it per environment.
const BRANDFETCH_CLIENT = import.meta.env?.VITE_BRANDFETCH_CLIENT || "1id6tOCGJiVC9uvsmeB"

// Reduces whatever the user typed (a full URL, "www." prefix, a path, or a
// bare domain) to the bare hostname Brandfetch needs — e.g.
// "https://www.netflix.com/browse" → "netflix.com". Returns "" when empty.
export function normalizeDomain(input: string): string {
  let s = input.trim().toLowerCase()
  if (!s) return ""
  try {
    // Prepend a scheme so the URL parser also handles bare "netflix.com/x".
    s = new URL(s.includes("://") ? s : `https://${s}`).hostname
  } catch {
    s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, "").split(/[/?#]/)[0]
  }
  return s.replace(/^www\./, "")
}

// Builds a high-resolution, transparent brand icon URL from Brandfetch for a
// domain. Accepts a full URL or bare domain (normalized here). We request the
// square "icon" (the brand symbol, no white plate) at 2× the display size for
// crisp retina rendering, and `fallback/404` so an unknown brand returns HTTP
// 404 — letting callers show their own fallback instead of a generic
// placeholder. Returns "" for an empty domain.
export function brandLogoSrc(domain: string, size = 64): string {
  const d = normalizeDomain(domain)
  if (!d) return ""
  const px = Math.min(512, Math.max(64, Math.round(size * 2)))
  return `https://cdn.brandfetch.io/${d}/icon/w/${px}/h/${px}/fallback/404?c=${BRANDFETCH_CLIENT}`
}

function normalize(s: string): string {
  return ` ${s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")} `
}

// Brazilian banks / wallets, matched by a substring of the account or card
// name. Order matters — more specific keywords first.
const BANKS: { keyword: string; domain: string }[] = [
  { keyword: "nubank", domain: "nubank.com.br" },
  { keyword: "ultravioleta", domain: "nubank.com.br" },
  { keyword: "bradesco", domain: "bradesco.com.br" },
  { keyword: "santander", domain: "santander.com.br" },
  { keyword: "itau", domain: "itau.com.br" },
  { keyword: "unibanco", domain: "itau.com.br" },
  { keyword: "personnalite", domain: "itau.com.br" },
  { keyword: "porto seguro", domain: "portoseguro.com.br" },
  { keyword: "portoseguro", domain: "portoseguro.com.br" },
  { keyword: "caixa", domain: "caixa.gov.br" },
  { keyword: "banco do brasil", domain: "bb.com.br" },
  { keyword: "banco inter", domain: "bancointer.com.br" },
  { keyword: "inter", domain: "bancointer.com.br" },
  { keyword: "c6", domain: "c6bank.com.br" },
  { keyword: "btg", domain: "btgpactual.com" },
  { keyword: "safra", domain: "safra.com.br" },
  { keyword: "sicoob", domain: "sicoob.com.br" },
  { keyword: "sicredi", domain: "sicredi.com.br" },
  { keyword: "banco pan", domain: "bancopan.com.br" },
  { keyword: "original", domain: "original.com.br" },
  { keyword: "neon", domain: "neon.com.br" },
  { keyword: "next", domain: "next.me" },
  { keyword: "will", domain: "willbank.com.br" },
  { keyword: "digio", domain: "digio.com.br" },
  { keyword: "mercado pago", domain: "mercadopago.com.br" },
  { keyword: "mercadopago", domain: "mercadopago.com.br" },
  { keyword: "picpay", domain: "picpay.com" },
  { keyword: "pagbank", domain: "pagbank.com.br" },
  { keyword: "pagseguro", domain: "pagbank.com.br" },
  { keyword: "ame digital", domain: "amedigital.com" },
  { keyword: "bmg", domain: "bancobmg.com.br" },
  { keyword: "unicred", domain: "unicred.com.br" },
  { keyword: "xp", domain: "xpi.com.br" },
  { keyword: "stone", domain: "stone.com.br" },
  { keyword: "cora", domain: "cora.com.br" },
  // International wallets / fintechs
  { keyword: "wise", domain: "wise.com" },
  { keyword: "nomad", domain: "nomadglobal.com" },
  { keyword: "revolut", domain: "revolut.com" },
  { keyword: "payoneer", domain: "payoneer.com" },
  { keyword: "paypal", domain: "paypal.com" },
  { keyword: "n26", domain: "n26.com" },
]

// Resolves a bank/wallet domain from a card or account name, or "" when none
// matches (so the caller keeps its colored fallback).
export function bankDomain(name: string): string {
  const h = normalize(name)
  return BANKS.find((b) => h.includes(b.keyword))?.domain ?? ""
}
