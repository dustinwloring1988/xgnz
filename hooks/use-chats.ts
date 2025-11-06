"use client"

import { useEffect, useState } from "react"
import { getChats, saveChat, deleteChat, getChat } from "@/lib/db"
import type { Chat } from "@/lib/types"

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadChats()
    const handler = () => loadChats()
    if (typeof window !== "undefined") {
      window.addEventListener("chats-updated", handler as EventListener)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("chats-updated", handler as EventListener)
      }
    }
  }, [])

  const loadChats = async () => {
    try {
      setIsLoading(true)
      const loadedChats = await getChats()
      setChats(loadedChats)
    } catch (error) {
      console.error("Failed to load chats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createChat = async (title = "New Chat"): Promise<Chat> => {
    const newChat: Chat = {
      id: String(Date.now()),
      title,
      timestamp: new Date().toISOString(),
      messages: 0,
      history: [],
    }
    await saveChat(newChat)
    setChats((prev) => [newChat, ...prev])
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("chats-updated"))
    }
    return newChat
  }

  const updateChat = async (chatId: string, updates: Partial<Chat>): Promise<void> => {
    // Fetch the latest version to avoid overwriting new fields (e.g., title)
    const currentFromDb = await getChat(chatId)
    const fallback = chats.find((c) => c.id === chatId)
    const base = currentFromDb || fallback
    if (!base) return

    const updated: Chat = { ...base, ...updates }
    await saveChat(updated)
    setChats((prev) => prev.map((c) => (c.id === chatId ? updated : c)))
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("chats-updated"))
    }
  }

  const removeChat = async (chatId: string): Promise<void> => {
    await deleteChat(chatId)
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("chats-updated"))
    }
  }

  return { chats, isLoading, createChat, updateChat, removeChat }
}
