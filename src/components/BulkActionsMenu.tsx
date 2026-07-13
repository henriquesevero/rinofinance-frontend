import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface BulkActionGroup {
  label: string
  actions: { label: string; run: () => void }[]
}

// A proper dropdown menu for bulk "mark all" actions, grouped by field.
// The menu auto-sizes to its content, so long labels are never clipped.
export function BulkActionsMenu({ groups }: { groups: BulkActionGroup[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            Marcar tudo
            <ChevronDown className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent>
        {groups.map((group, i) => (
          <div key={group.label}>
            {i > 0 && <DropdownMenuSeparator />}
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
