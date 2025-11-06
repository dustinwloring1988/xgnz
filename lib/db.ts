import type { Chat, UserSettings } from "./types"

const DB_NAME = "ai-chat-app"
const STORES = {
  CHATS: "chats",
  SETTINGS: "settings",
}

let db: IDBDatabase | null = null

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      if (!database.objectStoreNames.contains(STORES.CHATS)) {
        database.createObjectStore(STORES.CHATS, { keyPath: "id" })
      }

      if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
        database.createObjectStore(STORES.SETTINGS, { keyPath: "id" })
      }
    }
  })
}

async function getDB(): Promise<IDBDatabase> {
  if (!db) {
    db = await initDB()
  }
  return db
}

export async function getChats(): Promise<Chat[]> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.CHATS], "readonly")
    const store = transaction.objectStore(STORES.CHATS)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const chats = (request.result as Chat[]).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      resolve(chats)
    }
  })
}

export async function getChat(id: string): Promise<Chat | undefined> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.CHATS], "readonly")
    const store = transaction.objectStore(STORES.CHATS)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as Chat | undefined)
  })
}

export async function saveChat(chat: Chat): Promise<void> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.CHATS], "readwrite")
    const store = transaction.objectStore(STORES.CHATS)
    const request = store.put(chat)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function deleteChat(id: string): Promise<void> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.CHATS], "readwrite")
    const store = transaction.objectStore(STORES.CHATS)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getSettings(): Promise<UserSettings> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.SETTINGS], "readonly")
    const store = transaction.objectStore(STORES.SETTINGS)
    const request = store.get("user-settings")

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      resolve((request.result as UserSettings) || getDefaultSettings())
    }
  })
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORES.SETTINGS], "readwrite")
    const store = transaction.objectStore(STORES.SETTINGS)
    const request = store.put({ ...settings, id: "user-settings" })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

function getDefaultSettings(): UserSettings {
  return {
    id: "user-settings",
    notifications: true,
    messagePreview: true,
    saveChatHistory: true,
    enabledIntegrations: {
      webSearch: false,
      github: false,
      supabase: false,
      stripe: false,
      netlify: false,
    },
  }
}
