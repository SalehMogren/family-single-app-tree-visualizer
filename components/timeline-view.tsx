"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  MapPin,
  GraduationCap,
  Heart,
  Briefcase,
  Baby,
} from "lucide-react";
import { useTheme } from "@/hooks/useConfig";

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type:
    | "family"
    | "migration"
    | "marriage"
    | "business"
    | "education"
    | "reunion"
    | "birth";
  participants: string[];
}

interface TimelineViewProps {
  isDarkMode: boolean;
}

const eventIcons = {
  family: Users,
  migration: MapPin,
  marriage: Heart,
  business: Briefcase,
  education: GraduationCap,
  reunion: Users,
  birth: Baby,
};

const getEventColors = (isDarkMode: boolean, theme: any) => {
  if (!theme) {
    return {
      family: "#3B82F6",
      migration: "#10B981",
      marriage: "#EC4899",
      business: "#8B5CF6",
      education: "#F59E0B",
      reunion: "#6366F1",
      birth: "#F97316",
    };
  }
  const colors = isDarkMode ? theme.colors.dark : theme.colors.light;
  return {
    family: isDarkMode ? colors.border : colors.primary,
    migration: isDarkMode ? colors.secondary : colors.secondary,
    marriage: isDarkMode ? colors.textSecondary : colors.accent,
    business: isDarkMode ? colors.border : colors.primary,
    education: isDarkMode ? colors.secondary : colors.secondary,
    reunion: isDarkMode ? colors.textSecondary : colors.accent,
    birth: isDarkMode ? colors.border : colors.primary,
  };
};

export default function TimelineView({ isDarkMode }: TimelineViewProps) {
  const { theme } = useTheme();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const eventColors = getEventColors(isDarkMode, theme);

  useEffect(() => {
    fetch("/config/timeline-events.json")
      .then((response) => response.json())
      .then((data) => {
        // Sort events by date
        const sortedEvents = data.events.sort(
          (a: TimelineEvent, b: TimelineEvent) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setEvents(sortedEvents);
      })
      .catch((error) => {
        console.error("Error loading timeline events:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-96"
        style={{
          backgroundColor: theme ? (isDarkMode ? theme.colors.dark.background : theme.colors.light.background) : (isDarkMode ? '#111827' : '#FFFBEB')
        }}>
        <div className='text-center'>
          <Calendar
            className="mx-auto h-12 w-12 mb-4 animate-pulse"
            style={{
              color: theme ? (isDarkMode ? theme.colors.dark.accent : theme.colors.light.primary) : (isDarkMode ? '#60a5fa' : '#2563eb')
            }}
          />
          <p
            className="text-lg font-semibold"
            style={{
              color: theme ? (isDarkMode ? theme.colors.dark.text : theme.colors.light.text) : (isDarkMode ? '#F9FAFB' : '#1F2937'),
              fontFamily: theme ? theme.fonts.primary : "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
            }}>
            جاري تحميل الأحداث التاريخية...
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      id='timeline'
      className="w-full min-h-screen py-12 transition-colors duration-300"
      style={{
        background: theme ? (isDarkMode 
          ? `linear-gradient(135deg, ${theme.colors.dark.background} 0%, ${theme.colors.dark.surface} 50%, ${theme.colors.dark.background} 100%)`
          : `linear-gradient(135deg, ${theme.colors.light.background} 0%, ${theme.colors.light.accent} 100%)`
        ) : (isDarkMode 
          ? 'linear-gradient(135deg, #111827 0%, #1F2937 50%, #111827 100%)'
          : 'linear-gradient(135deg, #FFFBEB 0%, #FED7AA 100%)')
      }}>
      <div className='container mx-auto px-6'>
        <div className='text-center mb-12'>
          <h2
            className="text-4xl font-bold mb-4 transition-colors duration-300"
            style={{
              color: theme ? (isDarkMode ? theme.colors.dark.text : theme.colors.light.text) : (isDarkMode ? '#F9F3EF' : '#1B3C53'),
              fontFamily: theme ? theme.fonts.primary : "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
            }}>
            التسلسل الزمني للعائلة
          </h2>
          <p
            className="text-lg transition-colors duration-300"
            style={{
              color: theme ? (isDarkMode ? theme.colors.dark.textSecondary : theme.colors.light.textSecondary) : (isDarkMode ? '#D1D5DB' : '#6B7280'),
              fontFamily: theme ? theme.fonts.secondary : "Amiri, Noto Sans Arabic, Arial, sans-serif",
            }}>
            الأحداث المهمة في تاريخ العائلة
          </p>
        </div>

        <div className='relative'>
          {/* Timeline Line */}
          <div
            className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full transition-colors duration-300"
            style={{
              backgroundColor: theme ? (isDarkMode ? theme.colors.dark.border : theme.colors.light.primary) : (isDarkMode ? '#456882' : '#1B3C53')
            }}></div>

          <div className='space-y-8 sm:space-y-12'>
            {events.map((event, index) => {
              const Icon = eventIcons[event.type];
              const isEven = index % 2 === 0;

              return (
                <div key={event.id} className='relative'>
                  {/* Timeline Dot */}
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full border-4 flex items-center justify-center transition-colors duration-300 z-10"
                    style={{
                      borderColor: theme ? (isDarkMode ? theme.colors.dark.background : theme.colors.light.surface) : (isDarkMode ? '#1F2937' : '#FFFFFF'),
                      backgroundColor: eventColors[event.type]
                    }}>
                    <Icon 
                      className='h-6 w-6'
                      style={{
                        color: isDarkMode ? theme?.colors.dark.text : '#FFFFFF'
                      }}
                    />
                  </div>

                  {/* Event Card */}
                  <div
                    className={`flex ${
                      isEven ? "justify-start" : "justify-end"
                    } px-2 sm:px-0`}>
                    <Card
                      className={`w-full max-w-md sm:max-w-lg ${
                        isEven ? "mr-auto ml-2 sm:ml-8" : "ml-auto mr-2 sm:mr-8"
                      } border-2 shadow-xl backdrop-blur-sm transition-colors duration-300`}
                      style={{
                        borderColor: theme ? (isDarkMode ? theme.colors.dark.border : theme.colors.light.border) : (isDarkMode ? '#456882' : '#D2C1B6'),
                        backgroundColor: theme ? (isDarkMode ? theme.colors.dark.surface + 'E6' : theme.colors.light.surface + 'E6') : (isDarkMode ? '#1F2937E6' : '#FFFFFFE6')
                      }}>
                      <div className='p-4 sm:p-6'>
                        <div className='flex items-center justify-between mb-3'>
                          <Badge
                            variant='secondary'
                            className="transition-colors duration-300"
                            style={{
                              backgroundColor: theme ? (isDarkMode ? theme.colors.dark.primary + '80' : theme.colors.light.accent + '80') : (isDarkMode ? 'rgba(120, 53, 15, 0.5)' : 'rgba(251, 191, 36, 0.5)'),
                              color: theme ? (isDarkMode ? theme.colors.dark.text : theme.colors.light.text) : (isDarkMode ? '#F9F3EF' : '#1B3C53')
                            }}>
                            {formatDate(event.date)}
                          </Badge>
                          <Badge
                            className="text-white"
                            style={{
                              backgroundColor: eventColors[event.type]
                            }}>
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
                          className="text-xl font-bold mb-2 transition-colors duration-300"
                          style={{
                            color: theme ? (isDarkMode ? theme.colors.dark.text : theme.colors.light.text) : (isDarkMode ? '#F9F3EF' : '#1B3C53'),
                            fontFamily: theme ? theme.fonts.primary : "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
                          }}>
                          {event.title}
                        </h3>

                        <p
                          className="text-sm mb-4 leading-relaxed transition-colors duration-300"
                          style={{
                            color: theme ? (isDarkMode ? theme.colors.dark.textSecondary : theme.colors.light.textSecondary) : (isDarkMode ? '#D1D5DB' : '#6B7280'),
                            fontFamily: theme ? theme.fonts.secondary : "Amiri, Noto Sans Arabic, Arial, sans-serif",
                          }}>
                          {event.description}
                        </p>

                        {event.participants.length > 0 && (
                          <div>
                            <h4
                              className="text-sm font-semibold mb-2 transition-colors duration-300"
                              style={{
                                color: theme ? (isDarkMode ? theme.colors.dark.accent : theme.colors.light.primary) : (isDarkMode ? '#F9F3EF' : '#1B3C53'),
                                fontFamily: theme ? theme.fonts.primary : "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif",
                              }}>
                              المشاركون:
                            </h4>
                            <div className='flex flex-wrap gap-1'>
                              {event.participants.map((participant, idx) => (
                                <Badge
                                  key={idx}
                                  variant='outline'
                                  className="text-xs transition-colors duration-300"
                                  style={{
                                    borderColor: theme ? (isDarkMode ? theme.colors.dark.border : theme.colors.light.border) : (isDarkMode ? '#456882' : '#D2C1B6'),
                                    color: theme ? (isDarkMode ? theme.colors.dark.textSecondary : theme.colors.light.textSecondary) : (isDarkMode ? '#E8DDD4' : '#456882'),
                                    fontFamily: theme ? theme.fonts.secondary : "Amiri, Noto Sans Arabic, Arial, sans-serif",
                                  }}>
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
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
