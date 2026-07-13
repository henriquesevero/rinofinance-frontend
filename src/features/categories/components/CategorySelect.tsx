import { useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CategoryIcon } from "../categoryIcons"
import { useCategoriesStore } from "../store"

interface CategorySelectProps {
  // Empty string means "no category".
  value: string
  onChange: (categoryId: string) => void
  id?: string
}

const NONE = "__none__"

// Reusable category picker backed by the categories store. Renders each
// category with its color dot and optional emoji; "Sem categoria" clears
// the selection.
export function CategorySelect({ value, onChange, id }: CategorySelectProps) {
  const categories = useCategoriesStore((s) => s.categories)
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories)

  useEffect(() => {
    if (categories.length === 0) fetchCategories()
  }, [categories.length, fetchCategories])

  const selected = categories.find((c) => c.id === value)

  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : (v ?? ""))}>
      <SelectTrigger id={id} className="w-full" aria-label="Categoria">
        <SelectValue>
          {() =>
            selected ? (
              <span className="flex items-center gap-2">
                <CategoryIcon name={selected.icon} className="size-4" style={{ color: selected.color }} />
                {selected.name}
              </span>
            ) : (
              <span className="text-muted-foreground">Sem categoria</span>
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>
          <span className="text-muted-foreground">Sem categoria</span>
        </SelectItem>
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            <span className="flex items-center gap-2">
              <CategoryIcon name={c.icon} className="size-4" style={{ color: c.color }} />
              {c.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
