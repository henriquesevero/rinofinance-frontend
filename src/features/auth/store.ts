import { create } from "zustand"
import { clearAuth, loadAuth, saveAuth, updateStoredUser } from "@/lib/auth-storage"
import { toErrorMessage } from "@/lib/errors"
import { resetDataStores } from "@/lib/resetStores"
import { accountApi, authApi } from "./api"
import type { AuthUser } from "./types"

interface AuthState {
  token: string | null
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
  updateProfile: (name: string, avatarUrl: string) => Promise<void>
  changeEmail: (newEmail: string, currentPassword: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  deleteAccount: (currentPassword: string) => Promise<void>
}

const stored = loadAuth()

export const useAuthStore = create<AuthState>((set) => ({
  token: stored?.token ?? null,
  user: stored?.user ?? null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authApi.login(email, password)
      saveAuth(res)
      set({ token: res.token, user: res.user, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: toErrorMessage(err, "Erro ao entrar") })
      throw err
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null })
    try {
      await authApi.register(name, email, password)
      const res = await authApi.login(email, password)
      saveAuth(res)
      set({ token: res.token, user: res.user, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: toErrorMessage(err, "Erro ao cadastrar") })
      throw err
    }
  },

  logout: () => {
    clearAuth()
    set({ token: null, user: null })
    resetDataStores()
  },

  clearError: () => set({ error: null }),

  updateProfile: async (name, avatarUrl) => {
    const user = await accountApi.updateProfile(name, avatarUrl)
    updateStoredUser(user)
    set({ user })
  },

  changeEmail: async (newEmail, currentPassword) => {
    const user = await accountApi.changeEmail(newEmail, currentPassword)
    updateStoredUser(user)
    set({ user })
  },

  changePassword: async (currentPassword, newPassword) => {
    await accountApi.changePassword(currentPassword, newPassword)
  },

  deleteAccount: async (currentPassword) => {
    await accountApi.deleteAccount(currentPassword)
    clearAuth()
    set({ token: null, user: null })
  },
}))

// A 401 from any request means the token expired or was revoked; drop it
// so ProtectedRoute redirects to /login on the next render.
window.addEventListener("rinofinance:unauthorized", () => {
  useAuthStore.setState({ token: null, user: null })
})
