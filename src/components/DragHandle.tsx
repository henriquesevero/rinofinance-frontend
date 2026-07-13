import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

type DragHandleProps = React.HTMLAttributes<HTMLSpanElement> & { draggable?: boolean }

// A small grip that acts as the drag source for reorderable lists. Appears
// muted and turns grabbable on hover; spread the props from
// useReorder().getHandleProps(id) onto it.
export function DragHandle({ className, ...props }: DragHandleProps) {
  return (
    <span
      {...props}
      aria-label="Arraste para reordenar"
      className={cn(
        "flex cursor-grab items-center text-muted-foreground/50 transition-colors hover:text-foreground active:cursor-grabbing",
        className
      )}
    >
      <GripVertical className="size-4" />
    </span>
  )
}
