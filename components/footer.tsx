"use client"

import { Heart, Users, Mail, Phone, MapPin } from "lucide-react"

interface FooterProps {
  isDarkMode: boolean
}

export default function Footer({ isDarkMode }: FooterProps) {
  return (
    <footer
      className={`border-t transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900 border-amber-600" : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Family Info */}
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <div
                className={`p-2 rounded-lg transition-colors duration-300 ${
                  isDarkMode ? "bg-amber-900/50" : "bg-amber-100"
                }`}
              >
                <Users
                  className={`h-6 w-6 transition-colors duration-300 ${
                    isDarkMode ? "text-amber-400" : "text-amber-700"
                  }`}
                />
              </div>
              <h3
                className={`text-xl font-bold transition-colors duration-300 ${
                  isDarkMode ? "text-amber-300" : "text-amber-800"
                }`}
                style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
              >
                عائلة الأحمد
              </h3>
            </div>
            <p
              className={`text-sm leading-relaxed transition-colors duration-300 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
              style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif", lineHeight: "1.8" }}
            >
              عائلة عريقة تمتد جذورها لأكثر من قرنين من الزمان، تفخر بتاريخها العريق ومساهماتها في المجتمع عبر الأجيال
              المتعاقبة.
            </p>
          </div>

          {/* Contact Info */}
          <div className="text-center">
            <h4
              className={`text-lg font-bold mb-4 transition-colors duration-300 ${
                isDarkMode ? "text-amber-300" : "text-amber-800"
              }`}
              style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
            >
              معلومات التواصل
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <MapPin
                  className={`h-4 w-4 transition-colors duration-300 ${
                    isDarkMode ? "text-amber-400" : "text-amber-600"
                  }`}
                />
                <span
                  className={`text-sm transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  المملكة العربية السعودية - منطقة نجد
                </span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Mail
                  className={`h-4 w-4 transition-colors duration-300 ${
                    isDarkMode ? "text-amber-400" : "text-amber-600"
                  }`}
                />
                <span
                  className={`text-sm transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  family@al-ahmed.sa
                </span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Phone
                  className={`h-4 w-4 transition-colors duration-300 ${
                    isDarkMode ? "text-amber-400" : "text-amber-600"
                  }`}
                />
                <span
                  className={`text-sm transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  +966 50 123 4567
                </span>
              </div>
            </div>
          </div>

          {/* Family Stats */}
          <div className="text-center md:text-left">
            <h4
              className={`text-lg font-bold mb-4 transition-colors duration-300 ${
                isDarkMode ? "text-amber-300" : "text-amber-800"
              }`}
              style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
            >
              إحصائيات العائلة
            </h4>
            <div className="space-y-2">
              <div className="flex justify-center md:justify-start items-center gap-2">
                <span
                  className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? "text-amber-400" : "text-amber-600"
                  }`}
                  style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  45
                </span>
                <span
                  className={`text-sm transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  فرد من العائلة
                </span>
              </div>
              <div className="flex justify-center md:justify-start items-center gap-2">
                <span
                  className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? "text-amber-400" : "text-amber-600"
                  }`}
                  style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  5
                </span>
                <span
                  className={`text-sm transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  أجيال متتالية
                </span>
              </div>
              <div className="flex justify-center md:justify-start items-center gap-2">
                <span
                  className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? "text-amber-400" : "text-amber-600"
                  }`}
                  style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  200+
                </span>
                <span
                  className={`text-sm transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  سنة من التاريخ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div
          className={`mt-8 pt-8 border-t text-center transition-colors duration-300 ${
            isDarkMode ? "border-amber-600/30" : "border-amber-200"
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span
              className={`text-sm transition-colors duration-300 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
            >
              صُنع بـ
            </span>
            <Heart
              className={`h-4 w-4 transition-colors duration-300 ${isDarkMode ? "text-red-400" : "text-red-500"}`}
            />
            <span
              className={`text-sm transition-colors duration-300 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
            >
              لحفظ تاريخ العائلة
            </span>
          </div>
          <p
            className={`text-xs transition-colors duration-300 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
            style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
          >
            © 2024 عائلة الأحمد. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  )
}
