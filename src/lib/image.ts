export function resizeImageToDataUrl(
  file: File,
  maxSize = 256,
  quality = 0.85,
  mime: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("Não foi possível ler a imagem"))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem"))
          return
        }
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL(mime, mime === "image/png" ? undefined : quality))
      }
      img.src = reader.result as string
    }

    reader.readAsDataURL(file)
  })
}
