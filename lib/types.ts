export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface Chat {
  id: string
  title: string
  timestamp: string
  messages: number
  history?: ChatMessage[]
}

export interface UserSettings {
  id: string
  notifications: boolean
  messagePreview: boolean
  saveChatHistory: boolean
  enabledIntegrations: {
    webSearch: boolean
    github: boolean
    supabase: boolean
    stripe: boolean
    netlify: boolean
  }
}

export interface User {
  id: string
  name: string
  email: string
  workspace: string
  avatar: string
}
