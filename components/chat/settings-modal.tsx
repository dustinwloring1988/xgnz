"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Laptop, User, Bell } from "lucide-react"
import { useTheme } from "next-themes"
import { useSettings } from "@/hooks/use-settings"
import { mockUser } from "@/lib/mock-user"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TabType = "appearance" | "account" | "general"

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("appearance")
  const { theme, setTheme } = useTheme()
  const { settings, isLoading, updateSettings, toggleIntegration } = useSettings()

  const tabs = [
    { id: "appearance" as TabType, label: "Appearance", icon: Moon },
    { id: "account" as TabType, label: "Account", icon: User },
    { id: "general" as TabType, label: "General", icon: Bell },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] h-[80vh] sm:w-[560px] sm:h-[520px] max-w-none p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Theme</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`p-3 rounded-lg border-2 transition-colors text-center ${
                      theme === "light" ? "border-primary bg-muted" : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <Sun size={20} className="mx-auto mb-1" />
                    <div className="text-xs">Light</div>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`p-3 rounded-lg border-2 transition-colors text-center ${
                      theme === "dark" ? "border-primary bg-muted" : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <Moon size={20} className="mx-auto mb-1" />
                    <div className="text-xs">Dark</div>
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={`p-3 rounded-lg border-2 transition-colors text-center ${
                      theme === "system" ? "border-primary bg-muted" : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <Laptop size={20} className="mx-auto mb-1" />
                    <div className="text-xs">System</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Display Name</label>
                <input
                  type="text"
                  defaultValue={mockUser.name}
                  className="w-full mt-2 px-3 py-2 rounded-lg bg-muted text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Email</label>
                <input
                  type="email"
                  defaultValue={mockUser.email}
                  className="w-full mt-2 px-3 py-2 rounded-lg bg-muted text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button className="w-full">Update Profile</Button>
            </div>
          )}

          {/* General Tab */}
          {activeTab === "general" && (
            <div className="space-y-4">
              {!isLoading && settings && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Notifications</label>
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => updateSettings({ notifications: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Message Preview</label>
                    <input
                      type="checkbox"
                      checked={settings.messagePreview}
                      onChange={(e) => updateSettings({ messagePreview: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Save Chat History</label>
                    <input
                      type="checkbox"
                      checked={settings.saveChatHistory}
                      onChange={(e) => updateSettings({ saveChatHistory: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold mb-3">Enabled Integrations</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm">Web Search</label>
                        <input
                          type="checkbox"
                          checked={settings.enabledIntegrations.webSearch}
                          onChange={() => toggleIntegration("webSearch")}
                          className="w-4 h-4 rounded border-border"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm">GitHub</label>
                        <input
                          type="checkbox"
                          checked={settings.enabledIntegrations.github}
                          onChange={() => toggleIntegration("github")}
                          className="w-4 h-4 rounded border-border"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm">Supabase</label>
                        <input
                          type="checkbox"
                          checked={settings.enabledIntegrations.supabase}
                          onChange={() => toggleIntegration("supabase")}
                          className="w-4 h-4 rounded border-border"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm">Stripe</label>
                        <input
                          type="checkbox"
                          checked={settings.enabledIntegrations.stripe}
                          onChange={() => toggleIntegration("stripe")}
                          className="w-4 h-4 rounded border-border"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm">Netlify</label>
                        <input
                          type="checkbox"
                          checked={settings.enabledIntegrations.netlify}
                          onChange={() => toggleIntegration("netlify")}
                          className="w-4 h-4 rounded border-border"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
