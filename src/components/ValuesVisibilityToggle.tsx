import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVisibilityStore } from "@/lib/visibility-store"

export function ValuesVisibilityToggle() {
  const hidden = useVisibilityStore((s) => s.hidden)
  const toggle = useVisibilityStore((s) => s.toggle)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={hidden ? "Mostrar valores" : "Ocultar valores"}
    >
      {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </Button>
  )
}
