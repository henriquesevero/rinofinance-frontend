import { cn } from "@/lib/utils"

export const CARD_BRANDS = [
  { value: "visa", label: "Visa" },
  { value: "visa-silver", label: "Visa (prateado)" },
  { value: "visa-infinite", label: "Visa Infinite" },
  { value: "mastercard", label: "Mastercard" },
  { value: "mastercard-mono", label: "Mastercard (cinza)" },
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
        <img
          src="/card-brands/visa.png"
          alt="Visa"
          className={cn("h-7 w-[75px] object-contain drop-shadow-md", className)}
        />
      )
    case "visa-silver":
      return (
        <img
          src="/card-brands/visa-silver.png"
          alt="Visa"
          className={cn("h-7 w-[75px] object-contain drop-shadow-md", className)}
        />
      )
    case "visa-infinite":
      return (
        <img
          src="/card-brands/visa-infinite.png"
          alt="Visa Infinite"
          className={cn("h-7 w-[53px] object-contain drop-shadow-md", className)}
        />
      )
    case "mastercard":
      return (
        <div className={cn("flex h-9 w-11 flex-col items-center justify-end gap-[1.5px] drop-shadow-md", className)}>
          <div className="relative h-7 w-11 shrink-0">
            <span className="absolute left-0 top-0 size-7 rounded-full bg-[#EB001B]" />
            <span className="absolute left-[15px] top-0 size-7 rounded-full bg-[#F79E1B] opacity-90" />
          </div>
          <span className="text-[5px] font-semibold leading-none tracking-tight text-white">mastercard</span>
        </div>
      )
    case "mastercard-mono":
      return (
        <div
          className={cn("flex h-9 w-11 flex-col items-center justify-end gap-[1.5px] drop-shadow-md", className)}
          style={{ isolation: "isolate" }}
        >
          <div className="relative h-7 w-11 shrink-0">
            <span
              className="absolute left-0 top-0 size-7 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #3f4044 0%, #6a6b70 22%, #9fa0a5 40%, #e8cddc 50%, #c9dde8 58%, #7d7e83 76%, #45464a 100%)",
              }}
            />
            <span
              className="absolute left-[15px] top-0 size-7 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #d8d8dc 0%, #c2c2c6 30%, #e8d4b8 50%, #c2c2c6 70%, #d8d8dc 100%)",
                mixBlendMode: "screen",
              }}
            />
          </div>
          <span className="text-[5px] font-semibold leading-none tracking-tight text-neutral-400">mastercard</span>
        </div>
      )
    case "amex":
      return (
        <img
          src="/card-brands/amex.png"
          alt="American Express"
          className={cn("h-7 w-11 object-contain drop-shadow-md", className)}
        />
      )
    default:
      return null
  }
}
