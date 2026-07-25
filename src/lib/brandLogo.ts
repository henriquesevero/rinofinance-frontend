// Shared brand-logo helpers used by merchants (BrandLogo), credit cards and
// bank accounts. Builds the image URL from a domain and resolves a bank's
// domain from its name, so logos appear automatically without manual URLs.

const LOGODEV_TOKEN = import.meta.env?.VITE_LOGODEV_TOKEN

// Builds the logo image URL for a domain: logo.dev (real brand logos) when a
// token is configured, otherwise Google's favicon service (no token needed).
// Returns "" for an empty domain.
export function brandLogoSrc(domain: string, size = 64): string {
  const d = domain.trim()
  if (!d) return ""
  return LOGODEV_TOKEN
    ? `https://img.logo.dev/${d}?token=${LOGODEV_TOKEN}&size=${size}`
    : `https://www.google.com/s2/favicons?domain=${d}&sz=${size >= 64 ? 64 : 32}`
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
]

// Resolves a bank/wallet domain from a card or account name, or "" when none
// matches (so the caller keeps its colored fallback).
export function bankDomain(name: string): string {
  const h = normalize(name)
  return BANKS.find((b) => h.includes(b.keyword))?.domain ?? ""
}
