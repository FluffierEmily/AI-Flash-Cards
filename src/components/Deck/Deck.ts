import type { Flashcard } from "../Flashcard/Flashcard"

export type Deck = {
    id: string
    title: string
    description?: string
    count: number
    due: number
    enabled: boolean
    cards: Flashcard[]
}