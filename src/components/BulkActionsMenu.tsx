import { Check, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface BulkActionGroup {
  label: string
  actions: { label: string; run: () => void }[]
}

export interface SortConfig {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

export function BulkActionsMenu({ groups, sort }: { groups: BulkActionGroup[]; sort?: SortConfig }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="size-8" aria-label="Mais opções" title="Mais opções">
            <MoreHorizontal className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent>
        {sort && (
          <>
            <DropdownMenuLabel>Ordenar</DropdownMenuLabel>
            {sort.options.map((o) => (
              <DropdownMenuItem key={o.value} onClick={() => sort.onChange(o.value)}>
                <Check className={cn("size-4", sort.value === o.value ? "opacity-100" : "opacity-0")} />
                {o.label}
              </DropdownMenuItem>
            ))}
          </>
        )}
        {groups.map((group, i) => (
          <div key={group.label}>
            {(sort || i > 0) && <DropdownMenuSeparator />}
            <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
            {group.actions.map((action) => (
              <DropdownMenuItem key={action.label} onClick={action.run}>
                {action.label}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
