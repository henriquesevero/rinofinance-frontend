// Resizes an image file client-side (via canvas) and returns it as a
// JPEG data URL, so avatars stay small enough to store inline on the
// user document (no separate object storage needed for this version).
export function resizeImageToDataUrl(file: File, maxSize = 256, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("Não foi possível ler a imagem"))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem"))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = reader.result as string
    }

    reader.readAsDataURL(file)
  })
}
