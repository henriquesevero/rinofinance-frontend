
async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function gravatarUrl(email: string, size = 200, fallback?: string): Promise<string> {
  const hash = await sha256Hex(email.trim().toLowerCase())
  const params = new URLSearchParams({ s: String(size) })
  if (fallback) params.set("d", fallback)
  return `https://www.gravatar.com/avatar/${hash}?${params.toString()}`
}

export function imageExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}
