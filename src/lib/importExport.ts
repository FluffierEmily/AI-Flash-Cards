import type { Deck } from "../components/Deck/Deck"
import type { Flashcard, ReviewHistoryRecord } from "../components/Flashcard/Flashcard"
import type { SettingsState } from "../pages/Settings"
import { sanitizeDeck, sanitizeFlashcard } from "./deckStorage"
import { getAllReviewHistory } from "./historyStorage"

export interface ExportDataPayload {
  version: number
  exportedAt: string
  app: string
  decks: Deck[]
  reviewHistory?: ReviewHistoryRecord[]
  settings?: SettingsState
}

export interface ExportOptions {
  decks: Deck[]
  selectedDeckIds: string[]
  includeReviewData: boolean
  includeSettings: boolean
  currentSettings: SettingsState
}

export interface ParsedImportData {
  version?: number
  exportedAt?: string
  decks: Deck[]
  reviewHistory: ReviewHistoryRecord[]
  settings?: SettingsState
  hasReviewData: boolean
  hasSettings: boolean
}

/**
 * Strips SRS review statistics from flashcards so they can be exported or imported cleanly without review history.
 */
export function stripReviewDataFromCard(card: Flashcard): Flashcard {
  return {
    id: card.id,
    question: card.question,
    answer: card.answer,
    label: card.label,
    deckId: card.deckId,
    hints: card.hints ? [...card.hints] : undefined
  }
}

/**
 * Sanitizes a review history record from imported data.
 */
export function sanitizeReviewRecord(record: any): ReviewHistoryRecord | null {
  if (!record || typeof record !== "object") return null
  if (!record.cardId || !record.deckId || !record.timestamp) return null

  return {
    cardId: String(record.cardId),
    deckId: String(record.deckId),
    timestamp: String(record.timestamp),
    rating: ["again", "hard", "good", "easy"].includes(record.rating) ? record.rating : "good",
    easeFactor: typeof record.easeFactor === "number" ? record.easeFactor : 2.5,
    interval: typeof record.interval === "number" ? record.interval : 1,
    masteryLevel: ["weakness", "slipUp", "learning", "proficient", "mastered"].includes(record.masteryLevel)
      ? record.masteryLevel
      : "learning",
    reviewDuration: typeof record.reviewDuration === "number" ? record.reviewDuration : undefined,
    aiEvaluation: record.aiEvaluation,
    userAnswer: typeof record.userAnswer === "string" ? record.userAnswer : undefined
  }
}

/**
 * Generates the export JSON payload based on selected options.
 */
export async function createExportPayload({
  decks,
  selectedDeckIds,
  includeReviewData,
  includeSettings,
  currentSettings
}: ExportOptions): Promise<ExportDataPayload> {
  const chosenDecks = decks.filter(d => selectedDeckIds.includes(d.id))

  const processedDecks = chosenDecks.map(deck => {
    const cards = includeReviewData
      ? deck.cards.map(sanitizeFlashcard)
      : deck.cards.map(stripReviewDataFromCard)

    return {
      id: deck.id,
      title: deck.title,
      description: deck.description,
      due: includeReviewData ? deck.due : 0,
      enabled: deck.enabled,
      cards
    }
  })

  let exportedReviewHistory: ReviewHistoryRecord[] | undefined

  if (includeReviewData) {
    try {
      const allHistory = await getAllReviewHistory()
      const selectedDeckIdSet = new Set(selectedDeckIds)
      exportedReviewHistory = allHistory.filter(record => selectedDeckIdSet.has(record.deckId))
    } catch (e) {
      console.error("Failed to load review history for export", e)
      exportedReviewHistory = []
    }
  }

  const payload: ExportDataPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: "AI Flash Cards",
    decks: processedDecks
  }

  if (includeReviewData && exportedReviewHistory) {
    payload.reviewHistory = exportedReviewHistory
  }

  if (includeSettings) {
    payload.settings = { ...currentSettings }
  }

  return payload
}

/**
 * Triggers a browser download for a JSON string.
 */
export function downloadJsonFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Parses and validates raw JSON text from an uploaded file.
 */
export function parseAndValidateImportJson(rawText: string): ParsedImportData {
  let parsed: any
  try {
    parsed = JSON.parse(rawText)
  } catch (err: any) {
    throw new Error(`Invalid JSON file format: ${err.message || "Parse error"}`)
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid format: Root content must be a JSON object or array of decks.")
  }

  let rawDecks: any[] = []
  let rawReviewHistory: any[] = []
  let rawSettings: any = undefined
  let version: number | undefined = undefined
  let exportedAt: string | undefined = undefined

  // Handle direct array of decks or full export payload object
  if (Array.isArray(parsed)) {
    rawDecks = parsed
  } else {
    version = typeof parsed.version === "number" ? parsed.version : undefined
    exportedAt = typeof parsed.exportedAt === "string" ? parsed.exportedAt : undefined

    if (Array.isArray(parsed.decks)) {
      rawDecks = parsed.decks
    }

    if (Array.isArray(parsed.reviewHistory)) {
      rawReviewHistory = parsed.reviewHistory
    } else if (Array.isArray(parsed.review_history)) {
      rawReviewHistory = parsed.review_history
    } else if (Array.isArray(parsed.reviewData)) {
      rawReviewHistory = parsed.reviewData
    }

    if (parsed.settings && typeof parsed.settings === "object" && !Array.isArray(parsed.settings)) {
      rawSettings = parsed.settings
    }
  }

  if (rawDecks.length === 0 && rawReviewHistory.length === 0 && !rawSettings) {
    throw new Error("No valid decks, review history, or settings found in the uploaded JSON file.")
  }

  const sanitizedDecks = rawDecks.map(sanitizeDeck)
  const sanitizedReviewHistory = rawReviewHistory
    .map(sanitizeReviewRecord)
    .filter((r): r is ReviewHistoryRecord => r !== null)

  // Check if cards in decks have review stats
  const hasCardReviewStats = sanitizedDecks.some(deck =>
    deck.cards.some(c => c.lastReviewed || c.nextReviewDate || c.interval || c.repetition || c.masteryLevel)
  )

  const hasReviewData = sanitizedReviewHistory.length > 0 || hasCardReviewStats
  const hasSettings = Boolean(rawSettings && typeof rawSettings === "object")

  return {
    version,
    exportedAt,
    decks: sanitizedDecks,
    reviewHistory: sanitizedReviewHistory,
    settings: rawSettings,
    hasReviewData,
    hasSettings
  }
}
