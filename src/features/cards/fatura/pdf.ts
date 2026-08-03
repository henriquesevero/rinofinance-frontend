import type { TextItem } from "pdfjs-dist/types/src/display/api"

export async function extractPdfLines(file: File): Promise<string[]> {
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const data = new Uint8Array(await file.arrayBuffer())
  const doc = await pdfjs.getDocument({ data }).promise

  const lines: string[] = []
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()

    const rows = new Map<number, { x: number; str: string }[]>()
    for (const item of content.items as TextItem[]) {
      if (!("str" in item) || item.str.trim() === "") continue
      const y = Math.round(item.transform[5])
      const x = item.transform[4]
      const row = rows.get(y)
      if (row) row.push({ x, str: item.str })
      else rows.set(y, [{ x, str: item.str }])
    }

    const sortedY = [...rows.keys()].sort((a, b) => b - a)
    for (const y of sortedY) {
      const fragments = rows.get(y)!.sort((a, b) => a.x - b.x)
      const line = fragments
        .map((f) => f.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
      if (line) lines.push(line)
    }
  }

  await doc.destroy()
  return lines
}
