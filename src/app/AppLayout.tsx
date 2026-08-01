import { useEffect, useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { ArrowRightLeft, CalendarRange, CreditCard, LayoutDashboard, LogOut, Menu, Package, PiggyBank, ShoppingCart, Tags, Wallet, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { MonthSelector } from "@/components/MonthSelector"
import { ThemeToggle } from "@/components/ThemeToggle"
import { UserAvatar } from "@/components/UserAvatar"
import { cn } from "@/lib/utils"
import { useSwipeNavigation } from "@/lib/useSwipeNavigation"
import { useAuthStore } from "@/features/auth/store"
import { useCategoriesStore } from "@/features/categories/store"

const tabs = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/entradas-saidas", label: "Fluxo do mês", icon: ArrowRightLeft },
  { to: "/cards", label: "Cartões", icon: CreditCard },
  { to: "/accounts", label: "Contas", icon: Wallet },
  { to: "/investments", label: "Investimentos", icon: PiggyBank },
  { to: "/annual", label: "Visão anual", icon: CalendarRange },
  { to: "/itens-para-comprar", label: "Lista de desejos", icon: ShoppingCart },
  { to: "/itens-possuidos", label: "Itens que possuo", icon: Package },
  { to: "/categories", label: "Categorias", icon: Tags },
]

// Stable route order for the mobile left/right swipe navigation.
const tabRoutes = tabs.map((t) => t.to)

export function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const firstName = user?.name?.trim().split(/\s+/)[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"
  const location = useLocation()
  // On mobile the sidebar is a slide-in drawer; on md+ it's a static column.
  const [navOpen, setNavOpen] = useState(false)

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  // Mobile: swipe left/right to move between the top-level pages.
  useSwipeNavigation(tabRoutes)

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
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setNavOpen(false)} aria-hidden />
      )}

      {/* sidebar: static column on md+, slide-in drawer on mobile */}
      <aside
        data-swipe-ignore
        className={cn(
          "scrollbar-hide fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r bg-background px-3 pb-4 pt-[calc(env(safe-area-inset-top)_+_1rem)] transition-transform duration-200 md:translate-x-0 md:pt-4",
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
              viewTransition
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

        {/* global month picker — drives what period every screen shows */}
        <MonthSelector />

        {/* account + quick controls, pinned to the bottom of the sidebar */}
        <div className="mt-auto flex flex-col gap-1 border-t pt-3">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-2 py-2 transition-colors",
                isActive ? "bg-primary/10" : "hover:bg-muted"
              )
            }
          >
            <UserAvatar name={user?.name ?? ""} avatarUrl={user?.avatarUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{firstName ? `${greeting}, ${firstName}` : greeting}</p>
              <p className="truncate text-xs text-muted-foreground">Ver conta</p>
            </div>
          </NavLink>
          <div className="flex items-center gap-0.5 px-1">
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Sair">
              <LogOut className="size-4" />
            </Button>
            <div className="ml-auto flex items-center gap-0.5">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:ml-64">
        {/* mobile-only top bar: just the drawer opener + brand */}
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/95 px-3 pb-2 pt-[calc(env(safe-area-inset-top)_+_0.5rem)] backdrop-blur md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setNavOpen(true)} aria-label="Abrir menu">
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Logo showWordmark={false} markClassName="size-6" />
            <span className="text-base font-semibold tracking-tight">RinoFinance</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 overflow-x-clip px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
