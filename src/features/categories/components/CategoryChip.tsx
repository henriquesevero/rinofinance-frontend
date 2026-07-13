import { CategoryIcon } from "../categoryIcons"
import { useCategoriesStore } from "../store"

interface CategoryChipProps {
  categoryId?: string
  // When true, renders borderless (just colored icon + name) for use in a
  // dense meta subline; otherwise a bordered pill.
  dense?: boolean
}

// Small inline badge for an item's category (colored icon + name). Renders
// nothing when the item has no category or its category was deleted, so
// lists stay clean.
export function CategoryChip({ categoryId, dense }: CategoryChipProps) {
  const category = useCategoriesStore((s) => s.byId(categoryId))
  if (!category) return null

  if (dense) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1">
        <CategoryIcon name={category.icon} className="size-3" style={{ color: category.color }} />
        {category.name}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
      <CategoryIcon name={category.icon} className="size-3" style={{ color: category.color }} />
      {category.name}
    </span>
  )
}
