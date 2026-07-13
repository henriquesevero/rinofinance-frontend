import { cn } from "@/lib/utils"

interface UserAvatarProps {
  name: string
  avatarUrl?: string
  className?: string
}

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
  return initials || "?"
}

// Shows the user's photo when set, falling back to a gold initials
// avatar (matching the brand identity) otherwise.
export function UserAvatar({ name, avatarUrl, className }: UserAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn("size-8 shrink-0 rounded-full object-cover", className)}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground",
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
