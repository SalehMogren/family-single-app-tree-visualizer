"use client"

import { Card } from "@/components/ui/card"
import { Users, MapPin, Award, TrendingUp, BookOpen } from "lucide-react"
import { useFamilyBrief, useTheme, useAppConfig } from "@/hooks/useConfig"

interface FamilyBriefProps {
  isDarkMode: boolean
}

export default function FamilyBrief({ isDarkMode }: FamilyBriefProps) {
  const { familyBrief } = useFamilyBrief()
  const { theme } = useTheme()
  const { config } = useAppConfig()

  if (!familyBrief || !theme || !config) return null

  const colors = isDarkMode ? theme.colors.dark : theme.colors.light

  return (
    <section
      id="family-brief"
      className={`py-16 transition-colors duration-300`}
      style={{ backgroundColor: colors.background }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className={`p-3 rounded-full transition-colors duration-300`}
              style={{ backgroundColor: `${colors.primary}50` }}
            >
              <Users className={`h-8 w-8 transition-colors duration-300`} style={{ color: colors.primary }} />
            </div>
          </div>
          <h1
            className={`text-5xl font-bold mb-4 transition-colors duration-300`}
            style={{
              color: colors.primary,
              fontFamily: theme.fonts.primary,
            }}
          >
            {familyBrief.familyName}
          </h1>
          <p
            className={`text-xl mb-2 transition-colors duration-300`}
            style={{
              color: colors.secondary,
              fontFamily: theme.fonts.secondary,
            }}
          >
            {familyBrief.origin}
          </p>
          <p
            className={`text-lg transition-colors duration-300`}
            style={{
              color: colors.textSecondary,
              fontFamily: theme.fonts.secondary,
            }}
          >
            تأسست في {familyBrief.established}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Family Description */}
          <div className="lg:col-span-2">
            {config.features.familyHistory && (
              <Card
                className={`p-8 border-2 shadow-xl backdrop-blur-sm transition-colors duration-300`}
                style={{
                  borderColor: colors.border,
                  backgroundColor: `${colors.surface}90`,
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen className={`h-6 w-6 transition-colors duration-300`} style={{ color: colors.primary }} />
                  <h2
                    className={`text-2xl font-bold transition-colors duration-300`}
                    style={{
                      color: colors.primary,
                      fontFamily: theme.fonts.primary,
                    }}
                  >
                    تاريخ العائلة
                  </h2>
                </div>
                <p
                  className={`text-lg leading-relaxed mb-6 transition-colors duration-300`}
                  style={{
                    color: colors.text,
                    fontFamily: theme.fonts.secondary,
                    lineHeight: "2",
                  }}
                >
                  {familyBrief.description}
                </p>
                <p
                  className={`text-base leading-relaxed transition-colors duration-300`}
                  style={{
                    color: colors.textSecondary,
                    fontFamily: theme.fonts.secondary,
                    lineHeight: "1.8",
                  }}
                >
                  {familyBrief.notableMembers}
                </p>
              </Card>
            )}
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {config.features.familyStats && (
              <Card
                className={`p-6 border-2 shadow-xl backdrop-blur-sm transition-colors duration-300`}
                style={{
                  borderColor: colors.border,
                  backgroundColor: `${colors.surface}90`,
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className={`h-5 w-5 transition-colors duration-300`} style={{ color: colors.primary }} />
                  <h3
                    className={`text-lg font-bold transition-colors duration-300`}
                    style={{
                      color: colors.primary,
                      fontFamily: theme.fonts.primary,
                    }}
                  >
                    إحصائيات سريعة
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold transition-colors duration-300`}
                      style={{
                        color: colors.secondary,
                        fontFamily: theme.fonts.primary,
                      }}
                    >
                      الجيل الحالي:
                    </span>
                    <span
                      className={`text-xl font-bold transition-colors duration-300`}
                      style={{
                        color: colors.text,
                        fontFamily: theme.fonts.secondary,
                      }}
                    >
                      {familyBrief.currentGeneration}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold transition-colors duration-300`}
                      style={{
                        color: colors.secondary,
                        fontFamily: theme.fonts.primary,
                      }}
                    >
                      إجمالي الأفراد:
                    </span>
                    <span
                      className={`text-xl font-bold transition-colors duration-300`}
                      style={{
                        color: colors.text,
                        fontFamily: theme.fonts.secondary,
                      }}
                    >
                      {familyBrief.totalMembers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold transition-colors duration-300`}
                      style={{
                        color: colors.secondary,
                        fontFamily: theme.fonts.primary,
                      }}
                    >
                      سنوات التاريخ:
                    </span>
                    <span
                      className={`text-xl font-bold transition-colors duration-300`}
                      style={{
                        color: colors.text,
                        fontFamily: theme.fonts.secondary,
                      }}
                    >
                      {familyBrief.yearsOfHistory}+
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {config.features.familyGeo && (
              <Card
                className={`p-6 border-2 shadow-xl backdrop-blur-sm transition-colors duration-300`}
                style={{
                  borderColor: colors.border,
                  backgroundColor: `${colors.surface}90`,
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className={`h-5 w-5 transition-colors duration-300`} style={{ color: colors.primary }} />
                  <h3
                    className={`text-lg font-bold transition-colors duration-300`}
                    style={{
                      color: colors.primary,
                      fontFamily: theme.fonts.primary,
                    }}
                  >
                    الموقع الجغرافي
                  </h3>
                </div>
                <p
                  className={`text-sm leading-relaxed transition-colors duration-300`}
                  style={{
                    color: colors.text,
                    fontFamily: theme.fonts.secondary,
                    lineHeight: "1.8",
                  }}
                >
                  {familyBrief.geography.description}
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        {config.features.familyAchievements && (
          <Card
            className={`p-8 border-2 shadow-xl backdrop-blur-sm transition-colors duration-300`}
            style={{
              borderColor: colors.border,
              backgroundColor: `${colors.surface}90`,
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Award className={`h-6 w-6 transition-colors duration-300`} style={{ color: colors.primary }} />
              <h2
                className={`text-2xl font-bold transition-colors duration-300`}
                style={{
                  color: colors.primary,
                  fontFamily: theme.fonts.primary,
                }}
              >
                إنجازات العائلة
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {familyBrief.achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg transition-colors duration-300`}
                  style={{ backgroundColor: `${colors.primary}10` }}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 transition-colors duration-300`}
                    style={{ backgroundColor: colors.primary }}
                  ></div>
                  <p
                    className={`text-sm leading-relaxed transition-colors duration-300`}
                    style={{
                      color: colors.text,
                      fontFamily: theme.fonts.secondary,
                      lineHeight: "1.8",
                    }}
                  >
                    {achievement}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </section>
  )
}
