import { clearAuth, loadAuth } from "./auth-storage"

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080"

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = loadAuth()
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")
  if (auth?.token) {
    headers.set("Authorization", `Bearer ${auth.token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (response.status === 401) {
    clearAuth()
    window.dispatchEvent(new CustomEvent("rinofinance:unauthorized"))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      // Non-JSON body (e.g. an infra/proxy error page) — fall through
      // with body = null so the generic fallback message below is used
      // instead of letting a raw SyntaxError reach the caller.
      body = null
    }
  }

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `Erro inesperado (${response.status})`
    throw new ApiError(response.status, message)
  }

  return body as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string) => request<T>(path, { method: "PATCH" }),
  delete: (path: string, data?: unknown) =>
    request<void>(path, { method: "DELETE", body: data !== undefined ? JSON.stringify(data) : undefined }),
}
