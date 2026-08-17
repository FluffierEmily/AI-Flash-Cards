import type { EncryptedPayload } from "./crypto"

const DB_NAME = "ai_flash_cards_db"
const DB_VERSION = 1
const STORE_NAME = "settings"
const API_KEY_RECORD_ID = "encrypted_gemini_api_key"

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
      if (!db.objectStoreNames.contains("decks")) {
        db.createObjectStore("decks")
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveEncryptedApiKey(payload: EncryptedPayload): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(payload, API_KEY_RECORD_ID)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getEncryptedApiKey(): Promise<EncryptedPayload | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(API_KEY_RECORD_ID)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function removeEncryptedApiKey(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(API_KEY_RECORD_ID)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
