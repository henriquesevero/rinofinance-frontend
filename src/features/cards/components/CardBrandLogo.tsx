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
        <div className={cn("flex h-9 w-11 flex-col items-center justify-end gap-[1.5px] drop-shadow-md", className)}>
          <div className="relative h-7 w-11 shrink-0">
            <span
              className="absolute left-0 top-0 size-7 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #e5e5e5 0%, #ffffff 22%, #cfcfd4 40%, #f0c9dc 52%, #c9e3f0 64%, #ffffff 82%, #d4d4d8 100%)",
              }}
            />
            <span
              className="absolute left-[15px] top-0 size-7 rounded-full opacity-95"
              style={{
                background:
                  "linear-gradient(135deg, #ffffff 0%, #d8d8dc 28%, #efe3c8 50%, #d8d8dc 72%, #ffffff 100%)",
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
