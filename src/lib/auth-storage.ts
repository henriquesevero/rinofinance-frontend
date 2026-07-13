// Persists the authenticated user's token and profile in localStorage.
// Kept dependency-free from the auth feature/store so lib/api-client.ts
// can read the token without creating an import cycle
// (api-client -> auth-storage -> auth/store -> auth/api -> api-client).
const STORAGE_KEY = "rinofinance:auth"

export interface StoredAuthUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

export interface StoredAuth {
  token: string
  user: StoredAuthUser
}

export function loadAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredAuth
  } catch {
    return null
  }
}

export function saveAuth(auth: StoredAuth): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// Patches just the user portion of the stored auth (token untouched),
// used after profile/email updates so the new data survives a reload.
export function updateStoredUser(user: StoredAuthUser): void {
  const current = loadAuth()
  if (!current) return
  saveAuth({ ...current, user })
}
