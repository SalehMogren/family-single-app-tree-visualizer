"use client"

import { useState, useEffect } from "react"

interface AppConfig {
  appInfo: {
    title: string
    subtitle: string
    description: string
    version: string
  }
  features: {
    familyHistory: boolean
    familyStats: boolean
    familyGeo: boolean
    familyAchievements: boolean
    treeSettings: boolean
    darkMode: boolean
    exportTree: boolean
    editMembers: boolean
  }
  navigation: {
    showNavbar: boolean
    showFooter: boolean
    smoothScroll: boolean
  }
  tree: {
    defaultOrientation: string
    defaultDirection: string
    enableZoom: boolean
    enableDrag: boolean
    showMiniTree: boolean
    showDetailPanel: boolean
  }
}

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/config/app-config.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        setConfig(data)
        setError(null)
      })
      .catch((error) => {
        console.error("Error loading app config:", error)
        setError("Failed to load app configuration")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return { config, loading, error }
}
