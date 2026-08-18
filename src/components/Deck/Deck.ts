import type { Flashcard } from "../Flashcard/Flashcard"

export type Deck = {
    id: string
    title: string
    description?: string
    due: number
    enabled: boolean
    cards: Flashcard[]
}