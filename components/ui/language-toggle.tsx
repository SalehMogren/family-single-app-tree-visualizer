"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface LanguageToggleProps {
  isDarkMode?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ isDarkMode = false }) => {
  const { language, changeLanguage } = useTranslation();

  const toggleLanguage = () => {
    changeLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="min-w-[60px] font-semibold"
    >
      {language === 'ar' ? 'EN' : 'ع'}
    </Button>
  );
};