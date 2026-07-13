import { useEffect } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { CreditCard, LayoutDashboard, LogOut, PiggyBank, Tags, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { ThemeToggle } from "@/components/ThemeToggle"
import { UserAvatar } from "@/components/UserAvatar"
import { ValuesVisibilityToggle } from "@/components/ValuesVisibilityToggle"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/features/auth/store"
import { useCategoriesStore } from "@/features/categories/store"

const tabs = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/cards", label: "Cartões", icon: CreditCard },
  { to: "/accounts", label: "Contas", icon: Wallet },
  { to: "/investments", label: "Investimentos", icon: PiggyBank },
  { to: "/categories", label: "Categorias", icon: Tags },
]

export function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const firstName = user?.name?.trim().split(/\s+/)[0]

  // Load categories once for the whole authenticated session so their names
  // (CategoryChip, sort-by-category, etc.) are ready across every page right
  // after login, instead of popping in when some list happens to fetch them.
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories)
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-16 shrink-0 flex-col gap-6 border-r px-2 py-4 md:w-64 md:px-3">
        <div className="flex items-center gap-2 px-1 md:px-2">
          <Logo showWordmark={false} />
          <span className="hidden text-lg font-semibold tracking-tight md:inline">RinoFinance</span>
        </div>

        <nav className="flex flex-col gap-1">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors md:px-3",
                  "justify-center md:justify-start",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
          <span className="truncate text-lg font-semibold tracking-tight">Olá, {firstName}</span>
          <div className="flex items-center gap-2">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <UserAvatar name={user?.name ?? ""} avatarUrl={user?.avatarUrl} />
              <span className="hidden sm:inline">{user?.name}</span>
            </NavLink>
            <ValuesVisibilityToggle />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Sair">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
