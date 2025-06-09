"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Users, Menu, X } from "lucide-react"

interface NavbarProps {
  isDarkMode: boolean
  toggleTheme: () => void
}

export default function Navbar({ isDarkMode, toggleTheme }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  return (
    <nav
      className={`sticky top-0 z-50 border-b backdrop-blur-sm transition-colors duration-300 ${
        isDarkMode
          ? "bg-gray-900/95 border-amber-600 shadow-lg shadow-amber-900/20"
          : "bg-white/95 border-amber-200 shadow-lg shadow-amber-100/50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg transition-colors duration-300 ${
                isDarkMode ? "bg-amber-900/50" : "bg-amber-100"
              }`}
            >
              <Users
                className={`h-6 w-6 transition-colors duration-300 ${isDarkMode ? "text-amber-400" : "text-amber-700"}`}
              />
            </div>
            <div>
              <h1
                className={`text-xl font-bold transition-colors duration-300 ${
                  isDarkMode ? "text-amber-300" : "text-amber-800"
                }`}
                style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
              >
                شجرة العائلة
              </h1>
              <p
                className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? "text-amber-200/70" : "text-amber-600/70"
                }`}
                style={{ fontFamily: "Amiri, Noto Sans Arabic, Arial, sans-serif" }}
              >
                عائلة الأحمد
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("family-brief")}
              className={`text-sm font-medium transition-colors duration-300 hover:scale-105 ${
                isDarkMode ? "text-gray-300 hover:text-amber-300" : "text-gray-700 hover:text-amber-700"
              }`}
              style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
            >
              نبذة العائلة
            </button>
            <button
              onClick={() => scrollToSection("family-tree")}
              className={`text-sm font-medium transition-colors duration-300 hover:scale-105 ${
                isDarkMode ? "text-gray-300 hover:text-amber-300" : "text-gray-700 hover:text-amber-700"
              }`}
              style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
            >
              الشجرة التفاعلية
            </button>
            <div className="h-4 w-px bg-amber-300 opacity-50"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={`transition-all duration-300 hover:scale-110 ${
                isDarkMode ? "hover:bg-amber-900/50 text-amber-300" : "hover:bg-amber-100 text-amber-700"
              }`}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={`transition-all duration-300 ${
                isDarkMode ? "hover:bg-amber-900/50 text-amber-300" : "hover:bg-amber-100 text-amber-700"
              }`}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`transition-colors duration-300 ${isDarkMode ? "text-amber-300" : "text-amber-700"}`}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            className={`md:hidden border-t transition-colors duration-300 ${
              isDarkMode ? "border-amber-600 bg-gray-900/95" : "border-amber-200 bg-white/95"
            }`}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => scrollToSection("family-brief")}
                className={`block w-full text-right px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                  isDarkMode
                    ? "text-gray-300 hover:text-amber-300 hover:bg-amber-900/50"
                    : "text-gray-700 hover:text-amber-700 hover:bg-amber-100"
                }`}
                style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
              >
                نبذة العائلة
              </button>
              <button
                onClick={() => scrollToSection("family-tree")}
                className={`block w-full text-right px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                  isDarkMode
                    ? "text-gray-300 hover:text-amber-300 hover:bg-amber-900/50"
                    : "text-gray-700 hover:text-amber-700 hover:bg-amber-100"
                }`}
                style={{ fontFamily: "Raqaa One, Amiri, Noto Sans Arabic, Arial, sans-serif" }}
              >
                الشجرة التفاعلية
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
