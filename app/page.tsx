"use client";

import { useState } from "react";
import Navbar from "@/components/navbar";
import FamilyBrief from "@/components/family-brief";
import FamilyTree from "@/components/family-tree";
import Footer from "@/components/footer";
import { useAppConfig, useTheme } from "@/hooks/useConfig";
import TimelineView from "@/components/timeline-view";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { config } = useAppConfig();
  const { t } = useTranslation();
  const { theme } = useTheme();
  if (!theme) return null;
  const colors = isDarkMode ? theme.colors.dark : theme.colors.light;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (!config) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4'></div>
          <p className='text-lg font-semibold text-gray-700'>
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "dark" : ""
      }`}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
      }}
      dir='rtl'>
      {config.navigation.showNavbar && (
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      )}
      <main>
        {config.features.familyHistory && (
          <FamilyBrief isDarkMode={isDarkMode} />
        )}
        <FamilyTree isDarkMode={isDarkMode} />
        <TimelineView isDarkMode={isDarkMode} />
      </main>
      {config.navigation.showFooter && <Footer isDarkMode={isDarkMode} />}
    </div>
  );
}
