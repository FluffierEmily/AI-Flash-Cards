import { INITIAL_DECKS } from "../components/Deck/Decks"
import type { Deck } from "../components/Deck/Deck"
import type { Flashcard } from "../components/Flashcard/Flashcard"
import { openDB } from "./db"

const STORAGE_KEY = "flashcard_decks"

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
  if (typeof window === "undefined") return INITIAL_DECKS
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction("decks", "readonly")
      const store = tx.objectStore("decks")
      const request = store.get(STORAGE_KEY)
      
      request.onsuccess = () => {
        const result = request.result
        if (result && Array.isArray(result)) {
          resolve(result.map(sanitizeDeck))
        } else {
          resolve(INITIAL_DECKS)
        }
      }
      
      request.onerror = (e) => {
        console.error("Error fetching decks from IndexedDB, falling back to INITIAL_DECKS", e)
        resolve(INITIAL_DECKS)
      }
    })
  } catch (e) {
    console.error("Failed to open IndexedDB to load decks", e)
    return INITIAL_DECKS
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
      const request = store.put(sanitized, STORAGE_KEY)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    console.error("Failed to save decks to IndexedDB", e)
  }
}
