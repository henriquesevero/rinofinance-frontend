const STORAGE_KEY = "rinofinance:auth"

export interface StoredAuthUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
  shared?: boolean
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

export function updateStoredUser(user: StoredAuthUser): void {
  const current = loadAuth()
  if (!current) return
  saveAuth({ ...current, user })
}
