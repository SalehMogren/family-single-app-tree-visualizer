export interface ExportOptions {
  format: "png" | "pdf"
  quality?: number
  backgroundColor?: string
  includeWatermark?: boolean
}

export async function exportTreeAsImage(svgElement: SVGSVGElement, options: ExportOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
      const svgUrl = URL.createObjectURL(svgBlob)

      // Create canvas
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      // Set canvas size
      const rect = svgElement.getBoundingClientRect()
      canvas.width = rect.width * 2 // Higher resolution
      canvas.height = rect.height * 2
      ctx.scale(2, 2)

      // Set background
      if (options.backgroundColor) {
        ctx.fillStyle = options.backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Create image
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0)

          // Add watermark if requested
          if (options.includeWatermark) {
            ctx.font = "16px Arial"
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
            ctx.fillText("Family Tree App", 20, canvas.height - 30)
          }

          const dataUrl = canvas.toDataURL("image/png", options.quality || 0.9)
          URL.revokeObjectURL(svgUrl)
          resolve(dataUrl)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl)
        reject(new Error("Failed to load SVG image"))
      }

      img.src = svgUrl
    } catch (error) {
      reject(error)
    }
  })
}

export function downloadFile(dataUrl: string, filename: string): void {
  const link = document.createElement("a")
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function generatePDF(imageDataUrl: string, filename: string): Promise<void> {
  // For now, we'll just download as PNG since PDF generation requires additional libraries
  // In a real implementation, you would use libraries like jsPDF
  downloadFile(imageDataUrl, filename.replace(".pdf", ".png"))
}
