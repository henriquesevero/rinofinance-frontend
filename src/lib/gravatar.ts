// Gravatar helpers. Gravatar accepts a SHA-256 hex of the lowercased,
// trimmed email (the modern replacement for MD5), which the browser can
// compute natively via SubtleCrypto — no dependency needed.

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Builds the Gravatar image URL for an email. `size` is the pixel size;
// `fallback` is the d= parameter (e.g. "404" to 404 when none exists).
export async function gravatarUrl(email: string, size = 200, fallback?: string): Promise<string> {
  const hash = await sha256Hex(email.trim().toLowerCase())
  const params = new URLSearchParams({ s: String(size) })
  if (fallback) params.set("d", fallback)
  return `https://www.gravatar.com/avatar/${hash}?${params.toString()}`
}

// Resolves true if an image URL loads successfully (used to detect whether a
// Gravatar actually exists, via a d=404 probe).
export function imageExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}
