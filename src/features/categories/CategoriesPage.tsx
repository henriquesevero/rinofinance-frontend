import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DragHandle } from "@/components/DragHandle"
import { cn } from "@/lib/utils"
import { toErrorMessage } from "@/lib/errors"
import { useReorder } from "@/lib/useReorder"
import { CategoryIcon } from "./categoryIcons"
import { CategoryFormDialog } from "./components/CategoryFormDialog"
import { useCategoriesStore } from "./store"
import type { Category } from "./types"

type DialogState = { mode: "create" } | { mode: "edit"; category: Category } | null

export function CategoriesPage() {
  const categories = useCategoriesStore((s) => s.categories)
  const isLoading = useCategoriesStore((s) => s.isLoading)
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories)
  const createCategory = useCategoriesStore((s) => s.createCategory)
  const updateCategory = useCategoriesStore((s) => s.updateCategory)
  const deleteCategory = useCategoriesStore((s) => s.deleteCategory)
  const reorderCategories = useCategoriesStore((s) => s.reorderCategories)
  const [dialog, setDialog] = useState<DialogState>(null)
  const { order, draggingId, getItemProps, getHandleProps } = useReorder(categories, reorderCategories)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  async function handleDelete(category: Category) {
    if (!confirm(`Remover a categoria "${category.name}"? Os itens ficarão sem categoria.`)) return
    try {
      await deleteCategory(category.id)
      toast.success("Categoria removida")
    } catch (err) {
      toast.error(toErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Organize compras, assinaturas e saídas por categoria.
          </p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })}>
          <Plus className="size-4" />
          Nova categoria
        </Button>
      </div>

      {isLoading && categories.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Carregando...
        </div>
      ) : categories.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Nenhuma categoria ainda.</p>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {order.map((category) => (
            <li
              key={category.id}
              {...getItemProps(category.id)}
              className={cn(
                "group flex items-center gap-2 rounded-md border px-2 py-1 text-sm",
                draggingId === category.id && "opacity-40"
              )}
            >
              <DragHandle
                {...getHandleProps(category.id)}
                className="-ml-0.5 shrink-0 opacity-0 group-hover:opacity-100"
              />
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${category.color}22` }}
              >
                <CategoryIcon name={category.icon} className="size-3.5" style={{ color: category.color }} />
              </span>
              <span className="min-w-0 flex-1 truncate font-medium" title={category.name}>
                {category.name}
              </span>
              <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Editar categoria"
                  onClick={() => setDialog({ mode: "edit", category })}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Remover categoria"
                  onClick={() => handleDelete(category)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CategoryFormDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        initial={
          dialog?.mode === "edit"
            ? { name: dialog.category.name, color: dialog.category.color, icon: dialog.category.icon ?? "" }
            : undefined
        }
        onSubmit={async (input) => {
          try {
            if (dialog?.mode === "edit") {
              await updateCategory(dialog.category.id, input)
              toast.success("Categoria atualizada")
            } else {
              await createCategory(input)
              toast.success("Categoria criada")
            }
          } catch (err) {
            toast.error(toErrorMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
