import type { Deck } from "../components/Deck/Deck"
import type { Flashcard } from "../components/Flashcard/Flashcard"
import { openDB } from "./db"



export function sanitizeFlashcard(card: any): Flashcard {
  const sanitized: Flashcard = {
    id: String(card.id || ""),
    question: String(card.question || ""),
    answer: String(card.answer || ""),
    label: String(card.label || ""),
    deckId: String(card.deckId || "")
  }
  if (card.difficulty) {
    sanitized.difficulty = card.difficulty
  }
  if (card.masteryLevel) {
    sanitized.masteryLevel = card.masteryLevel
  }
  if (typeof card.interval === "number") {
    sanitized.interval = card.interval
  }
  if (typeof card.repetition === "number") {
    sanitized.repetition = card.repetition
  }
  if (typeof card.easeFactor === "number") {
    sanitized.easeFactor = card.easeFactor
  }
  if (card.nextReviewDate) {
    sanitized.nextReviewDate = String(card.nextReviewDate)
  }
  if (card.lastReviewed) {
    sanitized.lastReviewed = String(card.lastReviewed)
  }
  if (typeof card.lastReviewDuration === "number") {
    sanitized.lastReviewDuration = card.lastReviewDuration
  }
  if (Array.isArray(card.hints)) {
    sanitized.hints = card.hints.map((h: any) => String(h))
  }

  return sanitized;
}

export function sanitizeDeck(deck: any): Deck {
  const cards = Array.isArray(deck.cards) 
    ? deck.cards.map((c: any) => sanitizeFlashcard(c)) 
    : []
  
  const sanitized: Deck = {
    id: String(deck.id || ""),
    title: String(deck.title || ""),
    due: typeof deck.due === "number" ? deck.due : 0,
    enabled: typeof deck.enabled === "boolean" ? deck.enabled : true,
    cards
  }
  if (deck.description) {
    sanitized.description = String(deck.description)
  }
  return sanitized
}

export async function loadDecks(): Promise<Deck[]> {
  if (typeof window === "undefined") return []
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction("decks", "readonly")
      const store = tx.objectStore("decks")
      const request = store.getAll()
      
      request.onsuccess = () => {
        const result = request.result
        if (result && Array.isArray(result)) {
          resolve(result.map(sanitizeDeck))
        } else {
          resolve([])
        }
      }
      
      request.onerror = (e) => {
        console.error("Error fetching decks from IndexedDB, falling back to empty decks", e)
        resolve([])
      }
    })
  } catch (e) {
    console.error("Failed to open IndexedDB to load decks", e)
    return []
  }
}

export async function saveDecks(decks: Deck[]): Promise<void> {
  if (typeof window === "undefined") return
  try {
    const db = await openDB()
    const sanitized = decks.map(sanitizeDeck)
    return new Promise((resolve, reject) => {
      const tx = db.transaction("decks", "readwrite")
      const store = tx.objectStore("decks")
      const keysRequest = store.getAllKeys()
      
      keysRequest.onsuccess = () => {
        const existingKeys = keysRequest.result as string[]
        const newKeys = sanitized.map(d => d.id)
        
        for (const key of existingKeys) {
          if (!newKeys.includes(key)) {
            store.delete(key)
          }
        }
        
        for (const deck of sanitized) {
          store.put(deck)
        }
      }
      
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      keysRequest.onerror = () => reject(keysRequest.error)
    })
  } catch (e) {
    console.error("Failed to save decks to IndexedDB", e)
  }
}
