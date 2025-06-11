// Placeholder Cloudinary configuration for demo purposes
const CLOUDINARY_CONFIG = {
  cloudName: "demo-cloud-name",
  uploadPreset: "demo-upload-preset",
  apiKey: "demo-api-key",
}

export interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  width: number
  height: number
}

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // In demo mode, create a blob URL instead of actual upload
  const blobUrl = URL.createObjectURL(file)

  return {
    secure_url: blobUrl,
    public_id: `demo_${Date.now()}`,
    width: 400,
    height: 400,
  }
}

export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPG أو PNG أو WebP",
    }
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت",
    }
  }

  return { isValid: true }
}
