"use client"

import { useState } from "react"
import { Sidebar } from "@/components/chat/sidebar"
import { ChatArea } from "@/components/chat/chat-area"

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedChat, setSelectedChat] = useState<string | null>(null)

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
      />
      <ChatArea
        sidebarOpen={sidebarOpen}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        onToggleSidebar={() => setSidebarOpen(true)}
      />
    </div>
  )
}
