import { useEffect, useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { CreditCard, LayoutDashboard, LogOut, Menu, PiggyBank, Tags, Wallet, X } from "lucide-react"
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
  const location = useLocation()
  // On mobile the sidebar is a slide-in drawer; on md+ it's a static column.
  const [navOpen, setNavOpen] = useState(false)

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  // Load categories once for the whole authenticated session so their names
  // (CategoryChip, sort-by-category, etc.) are ready across every page right
  // after login, instead of popping in when some list happens to fetch them.
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories)
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return (
    <div className="flex min-h-svh">
      {/* backdrop behind the mobile drawer */}
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}

      {/* sidebar: static column on md+, slide-in drawer on mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col gap-6 border-r bg-background px-3 py-4 transition-transform duration-200 md:static md:z-auto md:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <Logo showWordmark={false} />
            <span className="text-lg font-semibold tracking-tight">RinoFinance</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setNavOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="size-5" />
          </Button>
        </div>

        <nav className="flex flex-col gap-1">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b px-3 py-3 sm:px-4">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
            onClick={() => setNavOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </Button>
          <span className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight sm:text-lg">
            Olá, {firstName}
          </span>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
            <NavLink
              to="/settings"
              aria-label="Configurações"
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
              <span className="hidden md:inline">{user?.name}</span>
            </NavLink>
            <ValuesVisibilityToggle />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Sair">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 overflow-x-clip px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
