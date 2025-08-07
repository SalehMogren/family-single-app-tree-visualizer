"use client";

import { Users, Mail, Phone, MapPin } from "lucide-react";
import { useFooterConfig, useTheme } from "@/hooks/useConfig";

interface FooterProps {
  isDarkMode: boolean;
}

export default function Footer({ isDarkMode }: FooterProps) {
  const { footerConfig } = useFooterConfig();
  const { theme } = useTheme();

  if (!footerConfig || !theme) return null;

  const colors = isDarkMode ? theme.colors.dark : theme.colors.light;

  return (
    <footer
      className={`border-t transition-colors duration-300`}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
      }}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid md:grid-cols-3 gap-8'>
          {/* Family Info */}
          <div className='text-center md:text-right'>
            <div className='flex items-center justify-center md:justify-start gap-3 mb-4'>
              <div
                className={`p-2 rounded-lg transition-colors duration-300`}
                style={{ backgroundColor: `${colors.primary}50` }}>
                <Users
                  className={`h-6 w-6 transition-colors duration-300`}
                  style={{ color: colors.primary }}
                />
              </div>
              <h3
                className={`text-xl font-bold transition-colors duration-300`}
                style={{
                  color: colors.primary,
                  fontFamily: theme.fonts.primary,
                }}>
                {footerConfig.familyInfo.name}
              </h3>
            </div>
            <p
              className={`text-sm leading-relaxed transition-colors duration-300`}
              style={{
                color: colors.textSecondary,
                fontFamily: theme.fonts.secondary,
                lineHeight: "1.8",
              }}>
              {footerConfig.familyInfo.description}
            </p>
          </div>

          {/* Contact Info */}
          <div className='text-center'>
            <h4
              className={`text-lg font-bold mb-4 transition-colors duration-300`}
              style={{
                color: colors.primary,
                fontFamily: theme.fonts.primary,
              }}>
              معلومات التواصل
            </h4>
            <div className='space-y-3'>
              <div className='flex items-center justify-center gap-3'>
                <MapPin
                  className={`h-4 w-4 transition-colors duration-300`}
                  style={{ color: colors.secondary }}
                />
                <span
                  className={`text-sm transition-colors duration-300`}
                  style={{
                    color: colors.textSecondary,
                    fontFamily: theme.fonts.secondary,
                  }}>
                  {footerConfig.contact.location}
                </span>
              </div>
              <div className='flex items-center justify-center gap-3'>
                <Mail
                  className={`h-4 w-4 transition-colors duration-300`}
                  style={{ color: colors.secondary }}
                />
                <span
                  className={`text-sm transition-colors duration-300`}
                  style={{
                    color: colors.textSecondary,
                    fontFamily: theme.fonts.secondary,
                  }}>
                  {footerConfig.contact.email}
                </span>
              </div>
              <div className='flex items-center justify-center gap-3'>
                <Phone
                  className={`h-4 w-4 transition-colors duration-300`}
                  style={{ color: colors.secondary }}
                />
                <span
                  className={`text-sm transition-colors duration-300`}
                  style={{
                    color: colors.textSecondary,
                    fontFamily: theme.fonts.secondary,
                  }}>
                  {footerConfig.contact.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Family Stats */}
          <div className='text-center md:text-left'>
            <h4
              className={`text-lg font-bold mb-4 transition-colors duration-300`}
              style={{
                color: colors.primary,
                fontFamily: theme.fonts.primary,
              }}>
              إحصائيات العائلة
            </h4>
            <div className='space-y-2'>
              <div className='flex justify-center md:justify-start items-center gap-2'>
                <span
                  className={`text-2xl font-bold transition-colors duration-300`}
                  style={{
                    color: colors.secondary,
                    fontFamily: theme.fonts.primary,
                  }}>
                  {footerConfig.stats.totalMembers}
                </span>
                <span
                  className={`text-sm transition-colors duration-300`}
                  style={{
                    color: colors.textSecondary,
                    fontFamily: theme.fonts.secondary,
                  }}>
                  فرد من العائلة
                </span>
              </div>
              <div className='flex justify-center md:justify-start items-center gap-2'>
                <span
                  className={`text-2xl font-bold transition-colors duration-300`}
                  style={{
                    color: colors.secondary,
                    fontFamily: theme.fonts.primary,
                  }}>
                  {footerConfig.stats.generations}
                </span>
                <span
                  className={`text-sm transition-colors duration-300`}
                  style={{
                    color: colors.textSecondary,
                    fontFamily: theme.fonts.secondary,
                  }}>
                  أجيال متتالية
                </span>
              </div>
              <div className='flex justify-center md:justify-start items-center gap-2'>
                <span
                  className={`text-2xl font-bold transition-colors duration-300`}
                  style={{
                    color: colors.secondary,
                    fontFamily: theme.fonts.primary,
                  }}>
                  {footerConfig.stats.yearsOfHistory}+
                </span>
                <span
                  className={`text-sm transition-colors duration-300`}
                  style={{
                    color: colors.textSecondary,
                    fontFamily: theme.fonts.secondary,
                  }}>
                  سنة من التاريخ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div
          className={`mt-8 pt-8 border-t text-center transition-colors duration-300`}
          style={{ borderColor: colors.border }}>
          <div className='flex items-center justify-center gap-2 mb-2'>
            <span
              className={`text-sm transition-colors duration-300`}
              style={{
                color: colors.textSecondary,
                fontFamily: theme.fonts.secondary,
              }}>
              {footerConfig.copyright.madeWithLove}
            </span>
          </div>
          <p
            className={`text-xs transition-colors duration-300`}
            style={{
              color: colors.textSecondary,
              fontFamily: theme.fonts.secondary,
            }}>
            © {footerConfig.copyright.year} {footerConfig.copyright.text}
          </p>
          <p
            className={`text-xs mt-2 transition-colors duration-300`}
            style={{
              color: colors.textSecondary,
              fontFamily: theme.fonts.secondary,
            }}>
            تم تطوير وتشغيل هذا التطبيق بواسطة{" "}
            <a
              href='https://salehmogren.com'
              target='_blank'
              rel='noopener noreferrer'
              className='transition-colors duration-300 hover:underline text-primary'>
              Saleh Mogren
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
