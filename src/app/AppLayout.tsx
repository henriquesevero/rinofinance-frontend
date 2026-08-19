import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { ArrowRightLeft, CalendarRange, CreditCard, Globe, Home, LayoutDashboard, Loader2, LogOut, Menu, Package, PiggyBank, ShoppingCart, Tags, Wallet } from "lucide-react"
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
  { to: "/contas-internet", label: "Contas na Internet", icon: Globe },
  { to: "/categories", label: "Categorias", icon: Tags },
]

const tabRoutes = tabs.map((t) => t.to)

const mobileNavTabs = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/entradas-saidas", label: "Fluxo", icon: ArrowRightLeft },
  { to: "/cards", label: "Cartões", icon: CreditCard },
  { to: "/accounts", label: "Contas", icon: Wallet },
]

const mobileMenuTabs = tabs.filter((t) => !mobileNavTabs.some((m) => m.to === t.to))

export function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const firstName = user?.name?.trim().split(/\s+/)[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useLayoutEffect(() => {
    mainRef.current?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [location.pathname])

  useSwipeNavigation(tabRoutes)

  const fetchCategories = useCategoriesStore((s) => s.fetchCategories)
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return (
    <div className="flex min-h-svh">
      <aside
        data-swipe-ignore
        className="scrollbar-hide fixed inset-y-0 left-0 z-50 hidden w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r bg-background px-3 pb-4 pt-4 md:flex"
      >
        <div className="flex items-center gap-2 px-1">
          <Logo showWordmark={false} />
          <span className="text-lg font-semibold tracking-tight">RinoFinance</span>
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

        <MonthSelector />

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
        <main
          ref={mainRef}
          className="mx-auto w-full max-w-6xl flex-1 overflow-x-hidden px-4 pb-24 pt-[calc(env(safe-area-inset-top)_+_1.5rem)] md:px-8 md:pb-6 md:pt-6"
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <nav
        data-swipe-ignore
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {mobileNavTabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            viewTransition
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
            navOpen || !mobileNavTabs.some((t) => location.pathname.startsWith(t.to))
              ? "text-primary"
              : "text-muted-foreground"
          )}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
          Menu
        </button>
      </nav>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 md:hidden",
          navOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setNavOpen(false)}
        aria-hidden
      />

      <div
        data-swipe-ignore
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl border-t bg-background pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform duration-300 ease-out md:hidden",
          navOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <button
          type="button"
          onClick={() => setNavOpen(false)}
          aria-label="Fechar menu"
          className="flex w-full shrink-0 justify-center pb-2 pt-3"
        >
          <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </button>

        <div className="flex-1 overflow-y-auto px-5 pb-2">
          <h2 className="pb-3 text-lg font-bold tracking-tight">Menu</h2>

          <div className="grid grid-cols-4 gap-x-2 gap-y-4">
            {mobileMenuTabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                viewTransition
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl py-1 text-center transition-colors",
                    isActive ? "text-primary" : "text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex size-12 items-center justify-center rounded-2xl transition-colors",
                        isActive ? "bg-primary/10 text-primary" : "bg-muted text-foreground"
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="text-[11px] font-medium leading-tight">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-1 border-t pt-4">
            <NavLink
              to="/settings"
              viewTransition
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
            <div className="flex items-center gap-0.5 px-1 pb-2">
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Sair">
                <LogOut className="size-4" />
              </Button>
              <div className="ml-auto flex items-center gap-0.5">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
