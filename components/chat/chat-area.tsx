"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Menu, Send, Plus, Paperclip, Mic, X, Check, File } from "lucide-react"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { IntegrationsMenu } from "./integrations-menu"
import { useChats } from "@/hooks/use-chats"
import { getChat } from "@/lib/db"
import type { ChatMessage } from "@/lib/types"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AttachedFile {
  file: File
  preview?: string
}

interface ChatAreaProps {
  sidebarOpen: boolean
  selectedChat: string | null
  onSelectChat: (chatId: string) => void
  onToggleSidebar: () => void
}

export function ChatArea({ sidebarOpen, selectedChat, onSelectChat, onToggleSidebar }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>(["Certified"])
  const [selectedModel, setSelectedModel] = useState<string>("gemma3:latest")
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [integrationsTriggerRect, setIntegrationsTriggerRect] = useState<DOMRect | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const { chats, updateChat, createChat } = useChats()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>([])
  const plusButtonRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [titleReady, setTitleReady] = useState<boolean>(() => {
    if (!selectedChat) return false
    const current = chats.find((c) => c.id === selectedChat)
    return (current?.messages ?? 0) > 0
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Load persisted message history when switching threads
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!selectedChat) {
        setMessages([])
        return
      }
      try {
        const persisted = await getChat(selectedChat)
        if (cancelled) return
        const history = (persisted?.history ?? []) as ChatMessage[]
        const mapped: Message[] = history.map((m, i) => ({
          id: `${persisted?.id || selectedChat}-${i}`,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
        }))
        setMessages(mapped)
      } catch (e) {
        setMessages([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedChat])

  // Keep header visibility in sync with selected chat's existing message count
  useEffect(() => {
    if (!selectedChat) {
      setTitleReady(false)
    } else {
      const current = chats.find((c) => c.id === selectedChat)
      setTitleReady((current?.messages ?? 0) > 0)
    }
  }, [selectedChat, chats])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false

      recognitionRef.current.onstart = () => setIsListening(true)
      recognitionRef.current.onend = () => setIsListening(false)

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("")
        setInput((prev) => prev + transcript)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }
    }
  }, [])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Ensure we have a selected chat; create one if needed
    let ensuredChatId = selectedChat
    if (!ensuredChatId) {
      try {
        const newChat = await createChat()
        ensuredChatId = newChat.id
        onSelectChat(newChat.id)
      } catch (e) {
        console.error("Failed to create new chat:", e)
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Generate chat title only if this thread has zero persisted messages
      if (ensuredChatId) {
        const current = chats.find((c) => c.id === ensuredChatId)
        const hasNoMessagesYet = (current?.messages ?? 0) === 0

        // Persist the user message in history and increment count
        const persisted = await getChat(ensuredChatId)
        const existingHistory = (persisted?.history ?? []) as ChatMessage[]
        const userSnapshot: ChatMessage = {
          role: "user",
          content: userMessage.content,
          timestamp: new Date().toISOString(),
        }
        const newCount = (current?.messages ?? 0) + 1
        await updateChat(ensuredChatId, {
          history: [...existingHistory, userSnapshot],
          messages: newCount,
          timestamp: new Date().toISOString(),
        })

        if (hasNoMessagesYet) {
          setTitleReady(false)
          try {
            const r = await fetch("/api/title", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: userMessage.content }),
            })
            if (r.ok) {
              const data = await r.json()
              const title = (data?.title as string) || "New Chat"
              await updateChat(ensuredChatId, { title })
            }
          } catch (err) {
            console.error("Title generation error:", err)
          } finally {
            setTitleReady(true)
          }
        }
      }

      // Stream assistant response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          model: selectedModel,
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const assistantId = (Date.now() + 1).toString()
      let assistantContent = ""
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
      ])

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (reader) {
        let buf = ""
        while (true) {
          const { value, done } = await reader.read()
          if (done) {
            // process any trailing buffered line
            const line = buf.trim()
            if (line) {
              try {
                const evt = JSON.parse(line)
              if (evt?.type === "delta" && typeof evt.content === "string") {
                assistantContent += evt.content
                setMessages((prev) => {
                  const updated = [...prev]
                  const idx = updated.findIndex((m) => m.id === assistantId)
                  if (idx !== -1) {
                    updated[idx] = { ...updated[idx], content: updated[idx].content + evt.content }
                  }
                  return updated
                })
              }
              } catch {}
            }
            break
          }
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split("\n")
          buf = lines.pop() ?? ""
          for (const raw of lines) {
            const line = raw.trim()
            if (!line) continue
            try {
              const evt = JSON.parse(line)
              if (evt?.type === "delta" && typeof evt.content === "string") {
                assistantContent += evt.content
                setMessages((prev) => {
                  const updated = [...prev]
                  const idx = updated.findIndex((m) => m.id === assistantId)
                  if (idx !== -1) {
                    updated[idx] = { ...updated[idx], content: updated[idx].content + evt.content }
                  }
                  return updated
                })
              } else if (evt?.type === "done") {
                // stop reading further
                await reader.cancel().catch(() => {})
                buf = ""
                break
              }
            } catch (e) {
              // ignore malformed JSON line
            }
          }
        }
      }

      // Persist assistant reply and increment count
      if (ensuredChatId) {
        const current = chats.find((c) => c.id === ensuredChatId)
        const persisted = await getChat(ensuredChatId)
        const existingHistory = (persisted?.history ?? []) as ChatMessage[]
        const finalAssistant = assistantContent
        const assistantSnapshot: ChatMessage | null = finalAssistant
          ? { role: "assistant", content: finalAssistant, timestamp: new Date().toISOString() }
          : null
        const newCount = (current?.messages ?? 0) + 1
        await updateChat(ensuredChatId, {
          history: assistantSnapshot ? [...existingHistory, assistantSnapshot] : existingHistory,
          messages: newCount,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleIntegrationsClick = () => {
    if (plusButtonRef.current) {
      setIntegrationsTriggerRect(plusButtonRef.current.getBoundingClientRect())
      setShowIntegrations(!showIntegrations)
    }
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("[v0] File selected:", file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        const preview = file.type.startsWith("image/") ? (event.target?.result as string) : undefined
        setAttachedFiles((prev) => [...prev, { file, preview }])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMicClick = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  const handleCancelRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const handleConfirmRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const tags = ["Certified", "Personalized", "Experienced", "Helpful"]
  const [availableModels, setAvailableModels] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    const fallback = [
      "gemma3:latest",
      "llama3.1:8b",
      "mistral:latest",
      "qwen2.5:7b",
      "phi3:mini",
    ]

    const loadModels = async () => {
      try {
        const r = await fetch("/api/models", { method: "GET" })
        if (!r.ok) throw new Error("failed to load models")
        const data = await r.json()
        const models: string[] = Array.isArray(data?.models) ? data.models : []
        if (!cancelled) {
          setAvailableModels(models.length ? models : fallback)
          if (models.length && !models.includes(selectedModel)) {
            setSelectedModel(models[0])
          }
        }
      } catch {
        if (!cancelled) {
          setAvailableModels(fallback)
          if (!fallback.includes(selectedModel)) {
            setSelectedModel(fallback[0])
          }
        }
      }
    }

    loadModels()
    return () => {
      cancelled = true
    }
  }, [])

  const suggestionPrompts: string[] = [
    "Draft a professional email introducing our new product.",
    "Summarize the following text I will paste next.",
    "Brainstorm 10 catchy names for a fitness app.",
    "Explain this piece of code in simple terms.",
  ]

  const handleSuggestionClick = (text: string) => {
    setInput(text)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const WaveAnimation = () => {
    useEffect(() => {
      const interval = setInterval(() => {
        setAnimationKey((prev) => prev + 1)
      }, 100)
      return () => clearInterval(interval)
    }, [])

    const bars = Array.from({ length: 50 }, (_, i) => {
      const height = Math.random() * 24 + 6
      const delay = Math.random() * 0.5
      return (
        <div
          key={`${i}-${animationKey}`}
          className="bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-sm"
          style={{
            width: "2px",
            height: `${height}px`,
            opacity: Math.random() * 0.6 + 0.4,
            transition: "all 0.1s ease-in-out",
          }}
        />
      )
    })

    return (
      <div className="flex items-center w-full gap-1">
        <div className="flex-1 border-t border-dashed border-muted-foreground/30"></div>
        <div className="flex items-center gap-0.5 justify-center px-4">{bars}</div>
        <div className="flex-1 border-t border-dashed border-muted-foreground/30"></div>
      </div>
    )
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/")
      const isText = file.type === "text/plain" || file.name.endsWith(".txt")
      return isImage || isText
    })

    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const preview = file.type.startsWith("image/") ? (event.target?.result as string) : undefined
        setAttachedFiles((prev) => [...prev, { file, preview }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Chat Header */}
      <div className={`border-b border-border bg-card p-4 flex items-center justify-between ${!titleReady ? 'hidden' : ''}`}>
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Open sidebar"
              onClick={onToggleSidebar}
            >
              <Menu size={18} />
            </Button>
          )}
          <div>
            <h2 className="font-semibold">{(chats.find((c) => c.id === selectedChat)?.title) || "New Chat"}</h2>
            <p className="text-xs text-muted-foreground">
              Updated 1 second ago · {messages.length > 0 ? `${messages.length} messages` : "0 messages"}
            </p>
          </div>
        </div>
      </div>

      {/* Tag Selection */}
      {selectedChat && messages.length > 0 && (
        <div className="border-b border-border bg-card px-4 py-3 flex gap-2 overflow-x-auto">
          {tags.map((tag) => (
            <Button
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
              }
            >
              {tag}
            </Button>
          ))}
        </div>
      )}

      {/* Suggestions (empty selected chat only) */}
      {(selectedChat && messages.length === 0) && (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
              {suggestionPrompts.map((p, i) => (
                <Card
                  key={i}
                  onClick={() => handleSuggestionClick(p)}
                  className="p-4 border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="text-sm">{p}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      {selectedChat && messages.length > 0 && (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="space-y-4">
            {messages.map((message, idx) => {
              const isLastAssistant =
                idx === messages.length - 1 && message.role === "assistant" && isLoading
              return (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    }`}
                  >
                    {message.content}
                    {isLastAssistant && (
                      <span className="ml-2 inline-flex items-center gap-2 text-muted-foreground/80 text-xs">
                        <Spinner className="size-3" />
                        Thinking…
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input Area (only when a chat is selected) */}
      {selectedChat && (
      <div className="border-t border-border bg-card p-6">
        <div className="flex flex-col space-y-4">
          {isListening ? (
            <div className="flex items-center gap-3 bg-muted p-4 rounded-lg">
              <WaveAnimation />
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  onClick={handleCancelRecording}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  title="Cancel recording"
                >
                  <X size={18} />
                </Button>
                <Button
                  onClick={handleConfirmRecording}
                  size="icon"
                  className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  title="Confirm recording"
                >
                  <Check size={18} />
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {attachedFiles.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-3">
                  {attachedFiles.map((attachedFile, index) => (
                    <div
                      key={index}
                      className="relative group rounded-lg overflow-hidden bg-muted p-2 border border-muted-foreground/20 hover:border-muted-foreground/50 transition-colors"
                    >
                      {attachedFile.preview ? (
                        <img
                          src={attachedFile.preview || "/placeholder.svg"}
                          alt="preview"
                          className="h-20 w-20 object-cover rounded"
                        />
                      ) : (
                        <div className="h-20 w-20 flex items-center justify-center bg-muted-foreground/10">
                          <File size={24} className="text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        onClick={() => removeAttachedFile(index)}
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-[100px]">
                        {attachedFile.file.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div
                ref={inputContainerRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex gap-3 transition-all duration-200 ${
                  isDragging ? "opacity-60 scale-98" : "opacity-100"
                }`}
              >
                <div className="flex gap-2 flex-col items-start">
                  <div className="flex gap-2">
                    <Button
                      ref={plusButtonRef}
                      onClick={handleIntegrationsClick}
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 flex-shrink-0"
                      title="Add integrations"
                    >
                      <Plus size={20} />
                    </Button>
                    <Button
                      onClick={handleAttachClick}
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 flex-shrink-0"
                      title="Attach file"
                    >
                      <Paperclip size={20} />
                    </Button>
                    <Button
                      onClick={handleMicClick}
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 flex-shrink-0"
                      title="Speech to text"
                    >
                      <Mic size={20} />
                    </Button>
                  </div>
                  <div className="w-44">
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="How can I help you today?"
                  className={`flex-1 px-4 py-3 rounded-lg bg-muted text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                    isDragging ? "ring-2 ring-primary/50" : ""
                  }`}
                  rows={3}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg flex-shrink-0"
                  size="icon"
                >
                  <Send size={20} />
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-2 py-1 bg-muted rounded">Enter</kbd> to send;{" "}
            <kbd className="px-2 py-1 bg-muted rounded">Shift+Enter</kbd> for newline
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.txt,.pdf,.doc,.docx"
        />
      </div>
      )}

      {/* Integrations Menu */}
      <IntegrationsMenu
        open={showIntegrations}
        onClose={() => setShowIntegrations(false)}
        triggerRect={integrationsTriggerRect}
      />
    </div>
  )
}
