"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Link, AlertCircle, CheckCircle } from "lucide-react"
import { uploadToCloudinary, validateImageFile } from "@/lib/cloudinary"

interface ImageUploadProps {
  onImageSelect: (imageUrl: string) => void
  currentImage?: string
  isDarkMode?: boolean
}

export default function ImageUpload({ onImageSelect, currentImage, isDarkMode }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [uploadMethod, setUploadMethod] = useState<"upload" | "url">("upload")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(null)

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      setError(validation.error || "ملف غير صالح")
      return
    }

    setUploading(true)

    try {
      const result = await uploadToCloudinary(file)
      onImageSelect(result.secure_url)
      setSuccess("تم رفع الصورة بنجاح! (وضع التجربة - الصورة مؤقتة)")
    } catch (error) {
      setError("فشل في رفع الصورة. يرجى المحاولة مرة أخرى.")
    } finally {
      setUploading(false)
    }
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      setError("يرجى إدخال رابط الصورة")
      return
    }

    // Basic URL validation
    try {
      new URL(urlInput)
      onImageSelect(urlInput)
      setSuccess("تم إضافة الصورة بنجاح!")
      setError(null)
    } catch {
      setError("رابط غير صالح. يرجى إدخال رابط صحيح")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant={uploadMethod === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMethod("upload")}
          className={isDarkMode ? "border-amber-600" : "border-amber-300"}
        >
          <Upload className="h-4 w-4 mr-2" />
          رفع ملف
        </Button>
        <Button
          variant={uploadMethod === "url" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMethod("url")}
          className={isDarkMode ? "border-amber-600" : "border-amber-300"}
        >
          <Link className="h-4 w-4 mr-2" />
          رابط
        </Button>
      </div>

      {uploadMethod === "upload" ? (
        <div className="space-y-3">
          <Label
            className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
          >
            اختر صورة من جهازك
          </Label>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className={`transition-colors duration-300 ${
              isDarkMode ? "bg-gray-700 border-amber-600" : "bg-white border-amber-300"
            }`}
          />
          {uploading && (
            <p
              className={`text-sm transition-colors duration-300 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}
              style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
            >
              جاري رفع الصورة...
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Label
            className={`transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
          >
            أدخل رابط الصورة
          </Label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className={`transition-colors duration-300 ${
                isDarkMode ? "bg-gray-700 border-amber-600" : "bg-white border-amber-300"
              }`}
            />
            <Button
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
              className={`transition-colors duration-300 ${
                isDarkMode ? "bg-amber-600 hover:bg-amber-700" : "bg-amber-500 hover:bg-amber-600"
              }`}
            >
              إضافة
            </Button>
          </div>
        </div>
      )}

      {/* Current Image Preview */}
      {currentImage && (
        <div className="mt-4">
          <Label
            className={`block mb-2 transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
          >
            الصورة الحالية:
          </Label>
          <img
            src={currentImage || "/placeholder.svg"}
            alt="Current"
            className="w-20 h-20 rounded-lg object-cover border-2 border-amber-300"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-sm text-red-700" style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}>
            {error}
          </p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-700" style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}>
            {success}
          </p>
        </div>
      )}

      {/* Demo Notice */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700" style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}>
          📝 وضع التجربة: الصور المرفوعة مؤقتة وستختفي عند إعادة تحميل الصفحة. للاستخدام الدائم، استخدم روابط الصور.
        </p>
      </div>
    </div>
  )
}
