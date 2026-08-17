export type Difficulty = "easy" | "medium" | "hard"

export type Flashcard = {
    id: string
    question: string
    answer: string
    label: string
    deckId: string
    difficulty?: Difficulty
    interval?: number
    repetition?: number
    easeFactor?: number
    nextReviewDate?: string
    lastReviewed?: string
    hints?: string[]
}