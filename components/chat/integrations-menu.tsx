"use client"

import { useState, useRef, useEffect } from "react"

interface IntegrationsMenuProps {
  open: boolean
  onClose: () => void
  triggerRect?: DOMRect | null
}

export function IntegrationsMenu({ open, onClose, triggerRect }: IntegrationsMenuProps) {
  const [integrations, setIntegrations] = useState({
    webSearch: false,
    github: false,
    supabase: false,
    stripe: false,
    netlify: false,
  })

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, onClose])

  if (!open) return null

  const toggleIntegration = (key: keyof typeof integrations) => {
    setIntegrations((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const integrationsList = [
    { key: "webSearch" as const, label: "Web Search", description: "Search the web for information" },
    { key: "github" as const, label: "GitHub", description: "Access GitHub repositories" },
    { key: "supabase" as const, label: "Supabase", description: "Query your Supabase database" },
    { key: "stripe" as const, label: "Stripe", description: "Access Stripe payment data" },
    { key: "netlify" as const, label: "Netlify", description: "Deploy to Netlify" },
  ]

  const menuTop = triggerRect ? triggerRect.top - 320 : "auto"
  const menuBottom = triggerRect ? `calc(100vh - ${triggerRect.top}px + 8px)` : "auto"

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg p-2"
      style={{
        bottom: menuBottom,
        left: triggerRect ? triggerRect.left : "auto",
        width: "280px",
      }}
    >
      <div className="space-y-1">
        {integrationsList.map(({ key, label, description }) => (
          <button
            key={key}
            onClick={() => toggleIntegration(key)}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <div className="flex-1">
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div
              className={`w-5 h-5 rounded border-2 ml-3 flex items-center justify-center transition-colors ${
                integrations[key] ? "bg-primary border-primary" : "border-muted-foreground hover:border-foreground"
              }`}
            >
              {integrations[key] && <span className="text-primary-foreground text-xs font-bold">✓</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
