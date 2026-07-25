import { useState } from "react"
import { Landmark } from "lucide-react"
import { cn } from "@/lib/utils"
import { bankDomain, brandLogoSrc } from "@/lib/brandLogo"
import type { Account } from "../types"

interface AccountAvatarProps {
  account: Pick<Account, "name" | "color" | "imageUrl">
  className?: string
}

// The account's logo: an uploaded image, else the bank's brand logo
// auto-detected from the account name (e.g. "Nubank" → Nubank logo), else a
// colored square with a bank icon. Used everywhere (list, detail, form).
export function AccountAvatar({ account, className }: AccountAvatarProps) {
  const [failed, setFailed] = useState(false)
  const src = account.imageUrl || (!failed ? brandLogoSrc(bankDomain(account.name)) : "")

  return (
    <div className={cn("shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10", className)}>
      {src ? (
        <img
          src={src}
          alt={account.name}
          onError={() => setFailed(true)}
          // Brand icons come from Brandfetch with a little padding (and some,
          // like Itaú, on a white plate). Zoom in slightly so the mark fills
          // edge-to-edge — the rounded, clipped frame removes any white border.
          className={cn("size-full object-cover", account.imageUrl ? "" : "scale-[1.34]")}
        />
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
