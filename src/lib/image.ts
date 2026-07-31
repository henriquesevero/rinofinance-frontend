// Resizes an image file client-side (via canvas) and returns it as a data
// URL so it stays small enough to store inline (no object storage needed for
// this version). Photos default to JPEG; logos should pass "image/png" (or
// "image/webp") to keep sharp edges/text and transparency instead of the
// blocky, opaque result JPEG gives them.
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
        // Higher-quality downscaling — noticeably crisper than the default.
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, width, height)
        // PNG is lossless (ignores quality); JPEG/WebP use it.
        resolve(canvas.toDataURL(mime, mime === "image/png" ? undefined : quality))
      }
      img.src = reader.result as string
    }

    reader.readAsDataURL(file)
  })
}
