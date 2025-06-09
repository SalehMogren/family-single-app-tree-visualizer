"use client"

import { useState } from "react"
import Navbar from "@/components/navbar"
import FamilyBrief from "@/components/family-brief"
import FamilyTree from "@/components/family-tree"
import Footer from "@/components/footer"

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`} dir="rtl">
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <main>
        <FamilyBrief isDarkMode={isDarkMode} />
        <FamilyTree isDarkMode={isDarkMode} />
      </main>
      <Footer isDarkMode={isDarkMode} />
    </div>
  )
}
