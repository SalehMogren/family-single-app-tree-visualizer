"use client"

import { Card } from "@/components/ui/card"
import { Users, MapPin, Award, TrendingUp, BookOpen } from "lucide-react"

interface FamilyBriefProps {
  isDarkMode: boolean
}

export default function FamilyBrief({ isDarkMode }: FamilyBriefProps) {
  const familyBrief = {
    familyName: "عائلة الأحمد",
    origin: "المملكة العربية السعودية - منطقة نجد",
    established: "القرن التاسع عشر الميلادي",
    description:
      "عائلة الأحمد من العائلات العريقة في منطقة نجد، اشتهرت بالتجارة والعلم عبر الأجيال. تمتد جذور العائلة إلى أكثر من قرنين من الزمان، وقد ساهم أفرادها في التنمية الاقتصادية والثقافية للمنطقة.",
    notableMembers: "تضم العائلة العديد من الشخصيات البارزة في مجالات التجارة والتعليم والخدمة العامة",
    currentGeneration: "الجيل الخامس",
    totalMembers: 45,
    achievements: [
      "تأسيس أول مدرسة أهلية في المنطقة عام 1950",
      "إنشاء مؤسسة خيرية لدعم الأيتام والمحتاجين",
      "المساهمة في تطوير التجارة المحلية والإقليمية",
      "تخريج أكثر من 20 طبيب ومهندس ومعلم",
    ],
  }

  return (
    <section
      id="family-brief"
      className={`py-16 transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-amber-50 to-orange-50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className={`p-3 rounded-full transition-colors duration-300 ${
                isDarkMode ? "bg-amber-900/50" : "bg-amber-100"
              }`}
            >
              <Users
                className={`h-8 w-8 transition-colors duration-300 ${isDarkMode ? "text-amber-400" : "text-amber-700"}`}
              />
            </div>
          </div>
          <h1
            className={`text-5xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? "text-amber-300" : "text-amber-800"
            }`}
            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
          >
            {familyBrief.familyName}
          </h1>
          <p
            className={`text-xl mb-2 transition-colors duration-300 ${
              isDarkMode ? "text-amber-200" : "text-amber-700"
            }`}
            style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
          >
            {familyBrief.origin}
          </p>
          <p
            className={`text-lg transition-colors duration-300 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
          >
            تأسست في {familyBrief.established}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Family Description */}
          <div className="lg:col-span-2">
            <Card
              className={`p-8 border-2 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
                isDarkMode ? "border-amber-600 bg-gray-800/90 text-white" : "border-amber-200 bg-white/90"
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <BookOpen
                  className={`h-6 w-6 transition-colors duration-300 ${
                    isDarkMode ? "text-amber-400" : "text-amber-700"
                  }`}
                />
                <h2
                  className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? "text-amber-300" : "text-amber-800"
                  }`}
                  style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  تاريخ العائلة
                </h2>
              </div>
              <p
                className={`text-lg leading-relaxed mb-6 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
                style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif", lineHeight: "2" }}
              >
                {familyBrief.description}
              </p>
              <p
                className={`text-base leading-relaxed transition-colors duration-300 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
                style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif", lineHeight: "1.8" }}
              >
                {familyBrief.notableMembers}
              </p>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card
              className={`p-6 border-2 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
                isDarkMode ? "border-amber-600 bg-gray-800/90" : "border-amber-200 bg-white/90"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp
                  className={`h-5 w-5 transition-colors duration-300 ${
                    isDarkMode ? "text-amber-400" : "text-amber-700"
                  }`}
                />
                <h3
                  className={`text-lg font-bold transition-colors duration-300 ${
                    isDarkMode ? "text-amber-300" : "text-amber-800"
                  }`}
                  style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  إحصائيات سريعة
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-semibold transition-colors duration-300 ${
                      isDarkMode ? "text-amber-200" : "text-amber-700"
                    }`}
                    style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                  >
                    الجيل الحالي:
                  </span>
                  <span
                    className={`text-xl font-bold transition-colors duration-300 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                    style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                  >
                    {familyBrief.currentGeneration}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`font-semibold transition-colors duration-300 ${
                      isDarkMode ? "text-amber-200" : "text-amber-700"
                    }`}
                    style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                  >
                    إجمالي الأفراد:
                  </span>
                  <span
                    className={`text-xl font-bold transition-colors duration-300 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                    style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                  >
                    {familyBrief.totalMembers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`font-semibold transition-colors duration-300 ${
                      isDarkMode ? "text-amber-200" : "text-amber-700"
                    }`}
                    style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                  >
                    سنوات التاريخ:
                  </span>
                  <span
                    className={`text-xl font-bold transition-colors duration-300 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                    style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                  >
                    200+
                  </span>
                </div>
              </div>
            </Card>

            <Card
              className={`p-6 border-2 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
                isDarkMode ? "border-green-600 bg-gray-800/90" : "border-green-200 bg-white/90"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <MapPin
                  className={`h-5 w-5 transition-colors duration-300 ${
                    isDarkMode ? "text-green-400" : "text-green-700"
                  }`}
                />
                <h3
                  className={`text-lg font-bold transition-colors duration-300 ${
                    isDarkMode ? "text-green-300" : "text-green-800"
                  }`}
                  style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                >
                  الموقع الجغرافي
                </h3>
              </div>
              <p
                className={`text-sm leading-relaxed transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
                style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif", lineHeight: "1.8" }}
              >
                تنتشر العائلة في عدة مناطق بالمملكة العربية السعودية، مع التركز الأساسي في منطقة نجد التاريخية.
              </p>
            </Card>
          </div>
        </div>

        {/* Achievements Section */}
        <Card
          className={`p-8 border-2 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
            isDarkMode ? "border-purple-600 bg-gray-800/90" : "border-purple-200 bg-white/90"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <Award
              className={`h-6 w-6 transition-colors duration-300 ${isDarkMode ? "text-purple-400" : "text-purple-700"}`}
            />
            <h2
              className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? "text-purple-300" : "text-purple-800"
              }`}
              style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
            >
              إنجازات العائلة
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {familyBrief.achievements.map((achievement, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg transition-colors duration-300 ${
                  isDarkMode ? "bg-gray-700/50" : "bg-purple-50"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 transition-colors duration-300 ${
                    isDarkMode ? "bg-purple-400" : "bg-purple-600"
                  }`}
                ></div>
                <p
                  className={`text-sm leading-relaxed transition-colors duration-300 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                  style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif", lineHeight: "1.8" }}
                >
                  {achievement}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
