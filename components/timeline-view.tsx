"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MapPin, GraduationCap, Heart, Briefcase, Baby } from "lucide-react"

interface TimelineEvent {
  id: string
  title: string
  description: string
  date: string
  type: "family" | "migration" | "marriage" | "business" | "education" | "reunion" | "birth"
  participants: string[]
}

interface TimelineViewProps {
  isDarkMode: boolean
}

const eventIcons = {
  family: Users,
  migration: MapPin,
  marriage: Heart,
  business: Briefcase,
  education: GraduationCap,
  reunion: Users,
  birth: Baby,
}

const eventColors = {
  family: "bg-blue-500",
  migration: "bg-green-500",
  marriage: "bg-pink-500",
  business: "bg-purple-500",
  education: "bg-yellow-500",
  reunion: "bg-indigo-500",
  birth: "bg-orange-500",
}

export default function TimelineView({ isDarkMode }: TimelineViewProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/config/timeline-events.json")
      .then((response) => response.json())
      .then((data) => {
        // Sort events by date
        const sortedEvents = data.events.sort(
          (a: TimelineEvent, b: TimelineEvent) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )
        setEvents(sortedEvents)
      })
      .catch((error) => {
        console.error("Error loading timeline events:", error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${isDarkMode ? "bg-gray-900" : "bg-amber-50"}`}>
        <div className="text-center">
          <Calendar
            className={`mx-auto h-12 w-12 mb-4 animate-pulse ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}
          />
          <p
            className={`text-lg font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
          >
            جاري تحميل الأحداث التاريخية...
          </p>
        </div>
      </div>
    )
  }

  return (
    <section
      id="timeline"
      className={`w-full min-h-screen py-12 transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-amber-50 to-orange-50"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2
            className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? "text-amber-300" : "text-amber-800"
            }`}
            style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
          >
            التسلسل الزمني للعائلة
          </h2>
          <p
            className={`text-lg transition-colors duration-300 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
            style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
          >
            الأحداث المهمة في تاريخ العائلة
          </p>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div
            className={`absolute left-1/2 transform -translate-x-1/2 w-1 h-full transition-colors duration-300 ${
              isDarkMode ? "bg-amber-600" : "bg-amber-400"
            }`}
          ></div>

          <div className="space-y-12">
            {events.map((event, index) => {
              const Icon = eventIcons[event.type]
              const isEven = index % 2 === 0

              return (
                <div key={event.id} className="relative">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full border-4 flex items-center justify-center transition-colors duration-300 ${
                      isDarkMode ? "border-gray-800 bg-gray-700" : "border-white bg-white"
                    } ${eventColors[event.type]}`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Event Card */}
                  <div className={`flex ${isEven ? "justify-start" : "justify-end"}`}>
                    <Card
                      className={`w-full max-w-md ${
                        isEven ? "mr-auto ml-8" : "ml-auto mr-8"
                      } border-2 shadow-xl backdrop-blur-sm transition-colors duration-300 ${
                        isDarkMode ? "border-amber-600 bg-gray-800/90" : "border-amber-200 bg-white/90"
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <Badge
                            variant="secondary"
                            className={`transition-colors duration-300 ${
                              isDarkMode ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {formatDate(event.date)}
                          </Badge>
                          <Badge className={`${eventColors[event.type]} text-white`}>
                            {event.type === "family" && "عائلي"}
                            {event.type === "migration" && "هجرة"}
                            {event.type === "marriage" && "زواج"}
                            {event.type === "business" && "أعمال"}
                            {event.type === "education" && "تعليم"}
                            {event.type === "reunion" && "لم شمل"}
                            {event.type === "birth" && "ولادة"}
                          </Badge>
                        </div>

                        <h3
                          className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                            isDarkMode ? "text-amber-300" : "text-amber-800"
                          }`}
                          style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          {event.title}
                        </h3>

                        <p
                          className={`text-sm mb-4 leading-relaxed transition-colors duration-300 ${
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                          style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                        >
                          {event.description}
                        </p>

                        {event.participants.length > 0 && (
                          <div>
                            <h4
                              className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
                                isDarkMode ? "text-amber-400" : "text-amber-700"
                              }`}
                              style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                            >
                              المشاركون:
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {event.participants.map((participant, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className={`text-xs transition-colors duration-300 ${
                                    isDarkMode ? "border-amber-600 text-amber-300" : "border-amber-300 text-amber-700"
                                  }`}
                                  style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
                                >
                                  {participant}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
