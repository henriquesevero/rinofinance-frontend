import { cn } from "@/lib/utils"

// A pulsing placeholder block used while content loads.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
}

export { Skeleton }
