"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Users, Menu, X } from "lucide-react";
import { useAppConfig, useTheme } from "@/hooks/useConfig";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { LanguageToggle } from "@/components/ui/language-toggle";

interface NavbarProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function Navbar({ isDarkMode, toggleTheme }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { config } = useAppConfig();
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (!config || !theme) return null;

  const scrollToSection = (sectionId: string) => {
    if (!config.navigation.smoothScroll) return;

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const colors = isDarkMode ? theme.colors.dark : theme.colors.light;

  return (
    <nav
      data-testid="navbar"
      className={`sticky top-0 z-50 border-b backdrop-blur-sm transition-colors duration-300`}
      style={{
        backgroundColor: `${colors.surface}95`,
        borderColor: colors.primary,
        boxShadow: theme.shadows.lg,
      }}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex items-center gap-3'>
            <div
              className={`p-2 rounded-lg transition-colors duration-300`}
              style={{ backgroundColor: `${colors.primary}50` }}>
              <Users
                className={`h-6 w-6 transition-colors duration-300`}
                style={{ color: colors.primary }}
              />
            </div>
            <div>
              <h1
                className={`text-xl font-bold transition-colors duration-300`}
                style={{
                  color: colors.primary,
                  fontFamily: theme.fonts.primary,
                }}>
                {config.appInfo.title}
              </h1>
              <p
                className={`text-xs transition-colors duration-300`}
                style={{
                  color: `${colors.primary}70`,
                  fontFamily: theme.fonts.secondary,
                }}>
                {config.appInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center gap-6'>
            {config.features.familyHistory && (
              <button
                onClick={() => scrollToSection("family-brief")}
                className={`text-sm font-medium transition-colors duration-300 hover:scale-105`}
                style={{
                  color: colors.text,
                  fontFamily: theme.fonts.primary,
                }}>
                {t("common.familyBrief")}
              </button>
            )}{" "}
            <button
              onClick={() => scrollToSection("family-tree")}
              className={`text-sm font-medium transition-colors duration-300 hover:scale-105`}
              style={{
                color: colors.text,
                fontFamily: theme.fonts.primary,
              }}>
              {t("common.interactiveTree")}
            </button>
            <button
              data-testid="tree-editor-link"
              aria-label={t("toolbar.treeEditor")}
              onClick={() => window.location.href = "/tree-editor"}
              className={`text-sm font-medium transition-colors duration-300 hover:scale-105`}
              style={{
                color: colors.text,
                fontFamily: theme.fonts.primary,
              }}>
              {t("toolbar.treeEditor")}
            </button>
            <div className='flex-1'></div>
            <div className='flex items-center gap-2'>
              <LanguageToggle isDarkMode={isDarkMode} />
              {config.features.darkMode && (
                <Button
                  data-testid="theme-toggle"
                  variant='ghost'
                  size='sm'
                  onClick={toggleTheme}
                  className={`transition-all duration-300 hover:scale-110`}
                  style={{ color: colors.primary }}>
                  {isDarkMode ? (
                    <Sun className='h-4 w-4' />
                  ) : (
                    <Moon className='h-4 w-4' />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className='md:hidden flex items-center gap-2'>
            <LanguageToggle isDarkMode={isDarkMode} />
            {config.features.darkMode && (
              <Button
                variant='ghost'
                size='sm'
                onClick={toggleTheme}
                style={{ color: colors.primary }}>
                {isDarkMode ? (
                  <Sun className='h-4 w-4' />
                ) : (
                  <Moon className='h-4 w-4' />
                )}
              </Button>
            )}
            <Button
              data-testid="mobile-menu-btn"
              variant='ghost'
              size='sm'
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ color: colors.primary }}>
              {isMenuOpen ? (
                <X className='h-5 w-5' />
              ) : (
                <Menu className='h-5 w-5' />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            data-testid="mobile-menu"
            className={`md:hidden border-t transition-colors duration-300`}
            style={{
              borderColor: colors.border,
              backgroundColor: `${colors.surface}95`,
            }}>
            <div className='px-2 pt-2 pb-3 space-y-1'>
              {config.features.familyHistory && (
                <button
                  onClick={() => scrollToSection("family-brief")}
                  className={`block w-full text-right px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300`}
                  style={{
                    color: colors.text,
                    fontFamily: theme.fonts.primary,
                  }}>
                  {t("common.familyBrief")}
                </button>
              )}{" "}
              <button
                onClick={() => scrollToSection("family-tree")}
                className={`block w-full text-right px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300`}
                style={{
                  color: colors.text,
                  fontFamily: theme.fonts.primary,
                }}>
                {t("common.interactiveTree")}
              </button>
              <button
                data-testid="tree-editor-link"
                aria-label={t("toolbar.treeEditor")}
                onClick={() => window.location.href = "/tree-editor"}
                className={`block w-full text-right px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300`}
                style={{
                  color: colors.text,
                  fontFamily: theme.fonts.primary,
                }}>
                {t("toolbar.treeEditor")}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
