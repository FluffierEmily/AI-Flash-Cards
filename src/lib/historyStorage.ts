import { openDB } from "./db"
import type { ReviewHistoryRecord } from "../components/Flashcard/Flashcard"

/**
 * Saves a single review history record.
 */
export async function saveReviewHistoryRecord(record: ReviewHistoryRecord): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("review_history", "readwrite")
    const store = tx.objectStore("review_history")
    const request = store.put(record)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Fetches all review history records in a specific date range.
 */
export async function getReviewsInDateRange(
  startDateIso: string,
  endDateIso: string
): Promise<ReviewHistoryRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("review_history", "readonly")
    const store = tx.objectStore("review_history")

    if (store.indexNames.contains("timestamp")) {
      const index = store.index("timestamp")
      const range = IDBKeyRange.bound(startDateIso, endDateIso)
      const request = index.openCursor(range)

      const results: ReviewHistoryRecord[] = []
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    } else {
      const request = store.openCursor()
      const results: ReviewHistoryRecord[] = []
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
        if (cursor) {
          const rec = cursor.value
          if (rec && rec.timestamp >= startDateIso && rec.timestamp <= endDateIso) {
            results.push(rec)
          }
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    }
  })
}

/**
 * Fetches all review history records for a specific deck.
 */
export async function getReviewsForDeck(deckId: string): Promise<ReviewHistoryRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("review_history", "readonly")
    const store = tx.objectStore("review_history")

    if (store.indexNames.contains("deckId")) {
      const index = store.index("deckId")
      const request = index.openCursor(IDBKeyRange.only(deckId))

      const results: ReviewHistoryRecord[] = []
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    } else {
      const request = store.openCursor()
      const results: ReviewHistoryRecord[] = []
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
        if (cursor) {
          if (cursor.value && cursor.value.deckId === deckId) {
            results.push(cursor.value)
          }
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    }
  })
}

/**
 * Fetches all review history records for a specific card sorted chronologically.
 */
export async function getReviewsForCard(cardId: string): Promise<ReviewHistoryRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("review_history", "readonly")
    const store = tx.objectStore("review_history")

    if (store.indexNames.contains("cardId")) {
      const index = store.index("cardId")
      const request = index.openCursor(IDBKeyRange.only(cardId))

      const results: ReviewHistoryRecord[] = []
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    } else {
      // Graceful fallback: scan records if index has not been created yet in local storage
      const request = store.openCursor()
      const results: ReviewHistoryRecord[] = []
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
        if (cursor) {
          if (cursor.value && cursor.value.cardId === cardId) {
            results.push(cursor.value)
          }
          cursor.continue()
        } else {
          results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    }
  })
}

/**
 * Fetches all review history records.
 */
export async function getAllReviewHistory(): Promise<ReviewHistoryRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("review_history", "readonly")
    const store = tx.objectStore("review_history")
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

/**
 * Saves multiple review history records in a single readwrite transaction.
 */
export async function saveReviewHistoryBatch(records: ReviewHistoryRecord[]): Promise<void> {
  if (!records || records.length === 0) return
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("review_history", "readwrite")
    const store = tx.objectStore("review_history")
    
    for (const record of records) {
      store.put(record)
    }

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Deletes all review history records.
 */
export async function clearAllReviewHistory(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction("review_history", "readwrite")
    const store = tx.objectStore("review_history")
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}


