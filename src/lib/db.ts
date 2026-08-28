import type { EncryptedPayload } from "./crypto"

const DB_NAME = "ai_flash_cards_db"
const DB_VERSION = 6
const STORE_NAME = "settings"

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }

      // Upgrade decks store to use keyPath "id" if not existing
      if (!db.objectStoreNames.contains("decks")) {
        db.createObjectStore("decks", { keyPath: "id" })
      }

      // Ensure review_history store exists with compound keyPath ["cardId", "timestamp"]
      let historyStore: IDBObjectStore
      if (!db.objectStoreNames.contains("review_history")) {
        historyStore = db.createObjectStore("review_history", { keyPath: ["cardId", "timestamp"] })
      } else {
        historyStore = (event.target as IDBOpenDBRequest).transaction!.objectStore("review_history")
      }

      if (!historyStore.indexNames.contains("deckId")) {
        historyStore.createIndex("deckId", "deckId", { unique: false })
      }
      if (!historyStore.indexNames.contains("cardId")) {
        historyStore.createIndex("cardId", "cardId", { unique: false })
      }
      if (!historyStore.indexNames.contains("timestamp")) {
        historyStore.createIndex("timestamp", "timestamp", { unique: false })
      }
      if (!historyStore.indexNames.contains("deckId_timestamp")) {
        historyStore.createIndex("deckId_timestamp", ["deckId", "timestamp"], { unique: false })
      }
      if (!historyStore.indexNames.contains("cardId_timestamp")) {
        historyStore.createIndex("cardId_timestamp", ["cardId", "timestamp"], { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const KEYS_STORAGE_KEY = "encrypted_api_keys"

export async function saveEncryptedApiKey(provider: string, payload: EncryptedPayload): Promise<void> {
  if (typeof window === "undefined") return
  const keysStr = localStorage.getItem(KEYS_STORAGE_KEY)
  const keys = keysStr ? JSON.parse(keysStr) : {}
  keys[provider.toLowerCase()] = payload
  localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys))
}

export async function getEncryptedApiKey(provider: string): Promise<EncryptedPayload | null> {
  if (typeof window === "undefined") return null
  const keysStr = localStorage.getItem(KEYS_STORAGE_KEY)
  if (!keysStr) return null
  try {
    const keys = JSON.parse(keysStr)
    return keys[provider.toLowerCase()] || null
  } catch (e) {
    console.error("Failed to parse encrypted API keys from localStorage", e)
    return null
  }
}

export async function removeEncryptedApiKey(provider: string): Promise<void> {
  if (typeof window === "undefined") return
  const keysStr = localStorage.getItem(KEYS_STORAGE_KEY)
  if (!keysStr) return
  try {
    const keys = JSON.parse(keysStr)
    delete keys[provider.toLowerCase()]
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys))
  } catch (e) {
    console.error("Failed to remove encrypted API key from localStorage", e)
  }
}

