import { cn } from "@/lib/utils"

export const CARD_BRANDS = [
  { value: "visa", label: "Visa" },
  { value: "visa-infinite", label: "Visa Infinite" },
  { value: "mastercard", label: "Mastercard" },
  { value: "mastercard-mono", label: "Mastercard (cinza)" },
  { value: "elo", label: "Elo" },
  { value: "amex", label: "American Express" },
] as const

interface CardBrandLogoProps {
  brand?: string
  className?: string
}

export function CardBrandLogo({ brand, className }: CardBrandLogoProps) {
  switch (brand) {
    case "visa":
      return (
        <div className={cn("flex h-7 w-11 items-center justify-center rounded-[5px] bg-white shadow-md", className)}>
          <span className="font-serif text-[15px] font-black italic tracking-tight text-[#1A1F71]">VISA</span>
        </div>
      )
    case "visa-infinite":
      return (
        <div
          className={cn(
            "flex h-7 w-11 flex-col items-center justify-center gap-px rounded-[5px] bg-neutral-950 shadow-md ring-1 ring-white/10",
            className
          )}
        >
          <span className="font-serif text-[11px] font-black italic leading-none tracking-tight text-white">VISA</span>
          <span className="text-[5px] font-semibold leading-none tracking-[0.12em] text-[#D4AF6A]">INFINITE</span>
        </div>
      )
    case "mastercard":
      return (
        <div className={cn("relative h-7 w-11 drop-shadow-md", className)}>
          <span className="absolute left-0 top-0 size-7 rounded-full bg-[#EB001B]" />
          <span className="absolute left-[15px] top-0 size-7 rounded-full bg-[#F79E1B] opacity-90" />
        </div>
      )
    case "mastercard-mono":
      return (
        <div className={cn("relative h-7 w-11 drop-shadow-md", className)}>
          <span className="absolute left-0 top-0 size-7 rounded-full bg-neutral-400" />
          <span className="absolute left-[15px] top-0 size-7 rounded-full bg-neutral-600 opacity-90" />
        </div>
      )
    case "elo":
      return (
        <div className={cn("flex h-7 w-11 items-center justify-center rounded-full bg-white shadow-md", className)}>
          <span className="flex items-center gap-[1.5px] text-[13px] font-black italic tracking-tight text-neutral-900">
            elo
            <span className="-ml-px flex gap-[1.5px]">
              <span className="size-[3.5px] rounded-full bg-[#FFCB05]" />
              <span className="size-[3.5px] rounded-full bg-[#00A4E0]" />
              <span className="size-[3.5px] rounded-full bg-[#EF4123]" />
            </span>
          </span>
        </div>
      )
    case "amex":
      return (
        <div className={cn("flex h-7 w-11 items-center justify-center rounded-[5px] bg-[#006FCF] shadow-md", className)}>
          <span className="text-[9px] font-extrabold tracking-wide text-white">AMEX</span>
        </div>
      )
    default:
      return null
  }
}
