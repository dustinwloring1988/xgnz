"use client"

import { useEffect, useState } from "react"
import { getSettings, saveSettings } from "@/lib/db"
import type { UserSettings } from "@/lib/types"

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const loadedSettings = await getSettings()
      setSettings(loadedSettings)
    } catch (error) {
      console.error("Failed to load settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSettings = async (updates: Partial<UserSettings>): Promise<void> => {
    if (settings) {
      const updated = { ...settings, ...updates }
      await saveSettings(updated)
      setSettings(updated)
    }
  }

  const toggleIntegration = async (integrationKey: keyof UserSettings["enabledIntegrations"]): Promise<void> => {
    if (settings) {
      const updated = {
        ...settings,
        enabledIntegrations: {
          ...settings.enabledIntegrations,
          [integrationKey]: !settings.enabledIntegrations[integrationKey],
        },
      }
      await saveSettings(updated)
      setSettings(updated)
    }
  }

  return { settings, isLoading, updateSettings, toggleIntegration }
}
