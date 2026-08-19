import { useRef } from "react"
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { CardArt } from "./CardArt"
import type { CardOverview } from "../types"

interface CardCarouselProps {
  cards: CardOverview[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  onEditCard: (card: CardOverview) => void
}

export function CardCarousel({ cards, activeIndex, onActiveIndexChange, onEditCard }: CardCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const isProgrammaticScroll = useRef(false)
  const programmaticTimeout = useRef<number | undefined>(undefined)

  function scrollToIndex(index: number) {
    const el = cardRefs.current[index]
    if (!el) return
    isProgrammaticScroll.current = true
    window.clearTimeout(programmaticTimeout.current)
    el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    programmaticTimeout.current = window.setTimeout(() => {
      isProgrammaticScroll.current = false
    }, 500)
  }

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(cards.length - 1, index))
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
    cardRefs.current.forEach((el, i) => {
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
    <div className="flex flex-col items-center gap-3">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[calc(50%-9rem)] pb-1 [scrollbar-width:none] sm:px-[calc(50%-10rem)] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, i) => (
          <div
            key={card.id}
            ref={(el) => {
              cardRefs.current[i] = el
            }}
            className="relative w-72 shrink-0 snap-center sm:w-80"
          >
            <CardArt
              card={card}
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
                  onEditCard(card)
                }}
                title="Editar cartão"
                aria-label="Editar cartão"
                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/30 text-white/90 backdrop-blur-sm transition hover:bg-black/50"
              >
                <Pencil className="size-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {cards.length > 1 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Cartão anterior"
            className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {cards.map((card, i) => (
              <button
                key={card.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir para cartão ${card.name}`}
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
            disabled={activeIndex === cards.length - 1}
            aria-label="Próximo cartão"
            className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
