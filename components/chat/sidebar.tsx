"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Plus, Settings, MoreVertical, Trash2, Edit2, LogOut } from "lucide-react"
import { Icons } from "@/components/icons"
import { SettingsModal } from "./settings-modal"
import { useChats } from "@/hooks/use-chats"
import type { Chat } from "@/lib/types"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  selectedChat: string | null
  onSelectChat: (chatId: string) => void
}

export function Sidebar({ isOpen, onToggle, selectedChat, onSelectChat }: SidebarProps) {
  const { chats, isLoading, createChat, updateChat, removeChat } = useChats()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const router = useRouter()

  const handleNewChat = async () => {
    const newChat = await createChat()
    onSelectChat(newChat.id)
  }

  const handleDeleteChat = async (chatId: string) => {
    await removeChat(chatId)
    if (selectedChat === chatId) {
      // Close the currently open thread
      onSelectChat(null)
    }
    setOpenMenu(null)
  }

  const handleStartEdit = (chat: Chat) => {
    setEditingId(chat.id)
    setEditTitle(chat.title)
    setOpenMenu(null)
  }

  const handleSaveEdit = async (chatId: string) => {
    if (editTitle.trim()) {
      await updateChat(chatId, { title: editTitle })
    }
    setEditingId(null)
    setEditTitle("")
  }

  return (
    <>
      <div
        className={`flex flex-col transition-all duration-300 ease-in-out ${isOpen ? "w-64" : "w-0"} border-r border-border bg-card relative`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {isOpen && (
            <div className="flex items-center gap-2">
              <Icons.logo className="h-6 w-6" />
              <span className="text-sm font-semibold">XGNZ Chat</span>
            </div>
          )}
          {isOpen && (
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8" aria-label="Collapse sidebar">
              <ChevronLeft size={18} />
            </Button>
          )}
        </div>

        {/* Search Bar */}
        {isOpen && (
          <div className="px-4 py-3 border-b border-border">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-3 py-2 rounded-lg bg-muted text-foreground placeholder-muted-foreground text-sm"
            />
          </div>
        )}

        {/* New Chat Button */}
        {isOpen && (
          <div className="px-4 py-3 border-b border-border">
            <Button
              onClick={handleNewChat}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Start New Chat
            </Button>
          </div>
        )}

        {/* Chat History */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {/* Pinned Chats */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pinned Chats</h3>
              {/* Pinned items would go here */}
            </div>

            {/* Recent Chats */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recent</h3>
              <div className="space-y-1">
                {isLoading ? (
                  <div className="text-xs text-muted-foreground py-4">Loading chats...</div>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`group relative p-3 rounded-lg transition-colors text-sm ${
                        selectedChat === chat.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {editingId === chat.id ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(chat.id)
                              if (e.key === "Escape") setEditingId(null)
                            }}
                            className="flex-1 px-2 py-1 text-xs rounded bg-muted text-foreground border border-border"
                            onBlur={() => handleSaveEdit(chat.id)}
                          />
                        </div>
                      ) : (
                        <>
                          <div onClick={() => !editingId && onSelectChat(chat.id)} className="cursor-pointer">
                            <div className="font-medium truncate">{chat.title}</div>
                            <div className="text-xs mt-1">{chat.timestamp}</div>
                            <div className="text-xs mt-1">{chat.messages} messages</div>
                          </div>

                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenu(openMenu === chat.id ? null : chat.id)
                              }}
                            >
                              <MoreVertical size={14} />
                            </Button>

                            {openMenu === chat.id && (
                              <div className="absolute right-0 mt-1 w-32 bg-card border border-border rounded-lg shadow-lg z-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStartEdit(chat)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 rounded-t-lg"
                                >
                                  <Edit2 size={14} />
                                  Rename
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteChat(chat.id)
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2 rounded-b-lg"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-2">
          {/* User Profile with dropdown */}
          {isOpen && (
            <div className="pt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center justify-between rounded-md p-2 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                        JD
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold">John Doe</div>
                        <div className="text-xs text-muted-foreground">Pro workspace</div>
                      </div>
                    </div>
                    <MoreVertical size={16} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                    <Settings size={14} /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/")}>
                    <LogOut size={14} /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal Component */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
