import { useRef } from "react"
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { AccountTile } from "./AccountTile"
import type { Account } from "../types"

interface AccountCarouselProps {
  accounts: Account[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  onEditAccount: (account: Account) => void
}

export function AccountCarousel({ accounts, activeIndex, onActiveIndexChange, onEditAccount }: AccountCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const isProgrammaticScroll = useRef(false)
  const programmaticTimeout = useRef<number | undefined>(undefined)

  function scrollToIndex(index: number) {
    const el = itemRefs.current[index]
    if (!el) return
    isProgrammaticScroll.current = true
    window.clearTimeout(programmaticTimeout.current)
    el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    programmaticTimeout.current = window.setTimeout(() => {
      isProgrammaticScroll.current = false
    }, 500)
  }

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(accounts.length - 1, index))
    onActiveIndexChange(clamped)
    scrollToIndex(clamped)
  }

  function handleScroll() {
    if (isProgrammaticScroll.current) return
    const scroller = scrollerRef.current
    if (!scroller) return
    const scrollerRect = scroller.getBoundingClientRect()
    const scrollerCenter = scrollerRect.left + scrollerRect.width / 2
    let closest = 0
    let minDist = Infinity
    itemRefs.current.forEach((el, i) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const dist = Math.abs(rect.left + rect.width / 2 - scrollerCenter)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    })
    if (closest !== activeIndex) onActiveIndexChange(closest)
  }

  return (
    <div className="flex flex-col items-center">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex w-full snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-[calc(50%-9rem)] pb-14 pt-4 [overscroll-behavior-x:contain] [scrollbar-width:none] sm:px-[calc(50%-10rem)] sm:pb-16 [&::-webkit-scrollbar]:hidden"
      >
        {accounts.map((account, i) => (
          <div
            key={account.id}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            className="relative w-72 shrink-0 snap-center sm:w-80"
          >
            <AccountTile
              account={account}
              className={cn(
                "transition-all duration-300",
                i === activeIndex
                  ? "scale-100 opacity-100 shadow-[0_20px_50px_-16px_rgba(97,218,251,0.5)]"
                  : "scale-95 opacity-45"
              )}
            />
            {i === activeIndex && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onEditAccount(account)
                }}
                title="Editar conta"
                aria-label="Editar conta"
                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/30 text-white/90 backdrop-blur-sm transition hover:bg-black/50"
              >
                <Pencil className="size-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {accounts.length > 1 && (
        <div className="-mt-9 flex items-center gap-3">
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Conta anterior"
            className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {accounts.map((account, i) => (
              <button
                key={account.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir para conta ${account.name}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === activeIndex ? "w-5 bg-foreground" : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === accounts.length - 1}
            aria-label="Próxima conta"
            className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
