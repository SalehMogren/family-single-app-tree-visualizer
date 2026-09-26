"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { supportedLanguages, SupportedLanguage } from '@/lib/i18n/config';

interface LanguageSelectorProps {
  isDarkMode?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  isDarkMode = false,
  variant = 'outline',
  size = 'sm'
}) => {
  const { language, changeLanguage } = useTranslation();

  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    changeLanguage(newLanguage);
  };

  const currentLanguage = supportedLanguages[language];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`flex items-center gap-2 ${isDarkMode ? 'dark' : ''}`}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentLanguage?.name || 'العربية'}
          </span>
          <span className="sm:hidden">
            {currentLanguage?.flag || '🇸🇦'}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={`min-w-[120px] ${isDarkMode ? 'dark' : ''}`}
      >
        {Object.entries(supportedLanguages).map(([code, config]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as SupportedLanguage)}
            className={`flex items-center gap-2 cursor-pointer ${
              language === code ? 'bg-accent' : ''
            }`}
          >
            <span className="text-lg">{config.flag}</span>
            <span className="flex-1">{config.name}</span>
            {language === code && (
              <span className="text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};