"use client"

import { useState, useEffect } from "react"
import {
  type AppConfig,
  type FamilyBrief,
  type FooterConfig,
  type Theme,
  loadAppConfig,
  loadFamilyBrief,
  loadFooterConfig,
  loadTheme,
} from "@/lib/config"

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAppConfig()
      .then(setConfig)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { config, loading, error }
}

export function useFamilyBrief() {
  const [familyBrief, setFamilyBrief] = useState<FamilyBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFamilyBrief()
      .then(setFamilyBrief)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { familyBrief, loading, error }
}

export function useFooterConfig() {
  const [footerConfig, setFooterConfig] = useState<FooterConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFooterConfig()
      .then(setFooterConfig)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { footerConfig, loading, error }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTheme()
      .then(setTheme)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { theme, loading, error }
}
