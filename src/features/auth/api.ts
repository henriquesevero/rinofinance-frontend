import { apiClient } from "@/lib/api-client"
import type { AuthResponse, AuthUser } from "./types"

export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiClient.post<AuthUser>("/api/auth/register", { name, email, password }),
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>("/api/auth/login", { email, password }),
}

export const accountApi = {
  updateProfile: (name: string, avatarUrl: string) =>
    apiClient.put<AuthUser>("/api/account/profile", { name, avatarUrl }),
  changeEmail: (newEmail: string, currentPassword: string) =>
    apiClient.put<AuthUser>("/api/account/email", { newEmail, currentPassword }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put<void>("/api/account/password", { currentPassword, newPassword }),
  deleteAccount: (currentPassword: string) => apiClient.delete("/api/account", { currentPassword }),
}
