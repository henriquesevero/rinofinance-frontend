import { lazy, Suspense, type ComponentType } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppLayout } from "./AppLayout"
import { ProtectedRoute } from "./ProtectedRoute"

function lazyPage<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  return lazy(async () => ({ default: (await load())[name] as ComponentType }))
}

const LoginPage = lazyPage(() => import("@/features/auth/LoginPage"), "LoginPage")
const RegisterPage = lazyPage(() => import("@/features/auth/RegisterPage"), "RegisterPage")
const SettingsPage = lazyPage(() => import("@/features/auth/SettingsPage"), "SettingsPage")
const DashboardPage = lazyPage(() => import("@/features/dashboard/DashboardPage"), "DashboardPage")
const EntriesPage = lazyPage(() => import("@/features/dashboard/EntriesPage"), "EntriesPage")
const CardsPage = lazyPage(() => import("@/features/cards/CardsPage"), "CardsPage")
const CardDetailPage = lazyPage(() => import("@/features/cards/CardDetailPage"), "CardDetailPage")
const InvestmentsPage = lazyPage(() => import("@/features/investments/InvestmentsPage"), "InvestmentsPage")
const AnnualPage = lazyPage(() => import("@/features/annual/AnnualPage"), "AnnualPage")
const WishlistPage = lazyPage(() => import("@/features/wishlist/WishlistPage"), "WishlistPage")
const BelongingsPage = lazyPage(() => import("@/features/wishlist/WishlistPage"), "BelongingsPage")
const CategoriesPage = lazyPage(() => import("@/features/categories/CategoriesPage"), "CategoriesPage")
const AccountsPage = lazyPage(() => import("@/features/accounts/AccountsPage"), "AccountsPage")
const AccountDetailPage = lazyPage(() => import("@/features/accounts/AccountDetailPage"), "AccountDetailPage")

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={null}>{element}</Suspense>
}

export const router = createBrowserRouter([
  { path: "/login", element: withSuspense(<LoginPage />) },
  { path: "/register", element: withSuspense(<RegisterPage />) },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "entradas-saidas", element: <EntriesPage /> },
      { path: "cards", element: <CardsPage /> },
      { path: "cards/:cardId", element: <CardDetailPage /> },
      { path: "investments", element: <InvestmentsPage /> },
      { path: "annual", element: <AnnualPage /> },
      { path: "itens-para-comprar", element: <WishlistPage /> },
      { path: "itens-possuidos", element: <BelongingsPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "accounts", element: <AccountsPage /> },
      { path: "accounts/:accountId", element: <AccountDetailPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
])
