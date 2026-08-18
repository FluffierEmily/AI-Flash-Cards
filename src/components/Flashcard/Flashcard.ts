export type Difficulty = "easy" | "medium" | "hard"

export type MasteryLevel = "weakness" | "slipUp" | "learning" | "proficient" | "mastered"

export type ReviewHistoryEntry = {
  timestamp: string
  rating: "again" | "hard" | "good" | "easy"
  easeFactor: number
  interval: number
}

export type Flashcard = {
    id: string
    question: string
    answer: string
    label: string
    deckId: string
    difficulty?: Difficulty
    masteryLevel?: MasteryLevel
    interval?: number
    repetition?: number
    easeFactor?: number
    nextReviewDate?: string
    lastReviewed?: string
    hints?: string[]
    history?: ReviewHistoryEntry[]
}