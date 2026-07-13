import type { StoredAuthUser } from "@/lib/auth-storage"

export type AuthUser = StoredAuthUser

export interface AuthResponse {
  token: string
  user: AuthUser
}
