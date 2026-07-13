import { Landmark } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Account } from "../types"

interface AccountAvatarProps {
  account: Pick<Account, "name" | "color" | "imageUrl">
  className?: string
}

// The account's logo: the uploaded image cropped into a rounded square, or
// a colored square with a bank icon when there's no image. Used everywhere
// (list, detail, form) so the account always looks the same.
export function AccountAvatar({ account, className }: AccountAvatarProps) {
  return (
    <div className={cn("shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10", className)}>
      {account.imageUrl ? (
        <img src={account.imageUrl} alt={account.name} className="size-full object-cover" />
      ) : (
        <div
          className="flex size-full items-center justify-center text-white"
          style={{ background: `linear-gradient(135deg, ${account.color || "#6B7280"} 0%, rgba(0,0,0,0.4) 160%)` }}
        >
          <Landmark className="size-1/2" />
        </div>
      )}
    </div>
  )
}
