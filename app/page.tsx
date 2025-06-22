"use client";

import { useState } from "react";
import Navbar from "@/components/navbar";
import FamilyBrief from "@/components/family-brief";
import FamilyTree from "@/components/family-tree";
import Footer from "@/components/footer";
import { useAppConfig } from "@/hooks/useConfig";
import TimelineView from "@/components/timeline-view";

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { config } = useAppConfig();

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (!config) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4'></div>
          <p className='text-lg font-semibold text-gray-700'>
            جاري تحميل التطبيق...
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
