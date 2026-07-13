import { createBrowserRouter, Navigate } from "react-router-dom"
import { LoginPage } from "@/features/auth/LoginPage"
import { RegisterPage } from "@/features/auth/RegisterPage"
import { SettingsPage } from "@/features/auth/SettingsPage"
import { DashboardPage } from "@/features/dashboard/DashboardPage"
import { CardsPage } from "@/features/cards/CardsPage"
import { CardDetailPage } from "@/features/cards/CardDetailPage"
import { InvestmentsPage } from "@/features/investments/InvestmentsPage"
import { CategoriesPage } from "@/features/categories/CategoriesPage"
import { AccountsPage } from "@/features/accounts/AccountsPage"
import { AccountDetailPage } from "@/features/accounts/AccountDetailPage"
import { AppLayout } from "./AppLayout"
import { ProtectedRoute } from "./ProtectedRoute"

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
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
      { path: "cards", element: <CardsPage /> },
      { path: "cards/:cardId", element: <CardDetailPage /> },
      { path: "investments", element: <InvestmentsPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "accounts", element: <AccountsPage /> },
      { path: "accounts/:accountId", element: <AccountDetailPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
])
