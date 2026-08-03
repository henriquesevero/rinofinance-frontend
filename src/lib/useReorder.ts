import { useEffect, useRef, useState } from "react"

export function useReorder<T extends { id: string }>(items: T[], persist: (orderedIds: string[]) => void) {
  const [order, setOrder] = useState<T[]>(items)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const orderBeforeDrag = useRef<string[]>([])

  useEffect(() => {
    setOrder(items)
  }, [items])

  function handleDragEnter(overId: string) {
    if (!draggingId || draggingId === overId) return
    setOrder((prev) => {
      const from = prev.findIndex((i) => i.id === draggingId)
      const to = prev.findIndex((i) => i.id === overId)
      if (from === -1 || to === -1 || from === to) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  function getItemProps(id: string) {
    return {
      "data-reorder-item": true,
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDragEnter: () => handleDragEnter(id),
      onDrop: (e: React.DragEvent) => e.preventDefault(),
    }
  }

  function getHandleProps(id: string) {
    return {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        orderBeforeDrag.current = order.map((i) => i.id)
        setDraggingId(id)
        e.dataTransfer.effectAllowed = "move"
        const row = (e.currentTarget as HTMLElement).closest("[data-reorder-item]")
        if (row instanceof HTMLElement) e.dataTransfer.setDragImage(row, 16, 16)
      },
      onDragEnd: () => {
        setDraggingId(null)
        const ids = order.map((i) => i.id)
        const changed = ids.some((id, idx) => id !== orderBeforeDrag.current[idx])
        if (changed) persist(ids)
      },
    }
  }

  return { order, draggingId, getItemProps, getHandleProps }
}
