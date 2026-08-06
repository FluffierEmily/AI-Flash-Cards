import { Plus } from "lucide-react"
import type { Flashcard } from "./DummyFlashCard"

export interface Deck {
  id: string
  title: string
  description?: string
  count: number
  due: number
  enabled: boolean
  cards: Flashcard[]
}

export const INITIAL_DECKS: Deck[] = [
  {
    id: "deck-1",
    title: "System Architecture",
    description: "Core concepts of scalable software design, APIs, microservices, and system resilience.",
    count: 24,
    due: 3,
    enabled: true,
    cards: [
      {
        id: "1",
        category: "Architecture",
        difficulty: "Medium",
        question: "What is Spaced Repetition?",
        answer: "A learning technique where flashcards are scheduled for review at increasing intervals based on how well you remember them. It exploits the psychological spacing effect to maximize retention."
      },
      {
        id: "1-2",
        category: "Architecture",
        difficulty: "Hard",
        question: "What is the CAP Theorem?",
        answer: "In a distributed data store, you can only provide two of three guarantees: Consistency, Availability, and Partition Tolerance."
      }
    ]
  },
  {
    id: "deck-2",
    title: "Progressive Web Apps",
    description: "Service workers, web app manifests, caching strategies, and offline-first design.",
    count: 15,
    due: 5,
    enabled: true,
    cards: [
      {
        id: "2",
        category: "PWA",
        difficulty: "Easy",
        question: "Explain Offline-First Architecture",
        answer: "A design pattern where all data read/write operations are performed against a local database (like IndexedDB) first. Background synchronization handles syncing with server endpoints when online."
      }
    ]
  },
  {
    id: "deck-3",
    title: "Artificial Intelligence",
    description: "LLMs, prompt engineering, vector embeddings, and automated scoring models.",
    count: 18,
    due: 4,
    enabled: false, // Disabled deck example
    cards: [
      {
        id: "3",
        category: "AI & LLMs",
        difficulty: "Hard",
        question: "How does AI scoring improve traditional flashcards?",
        answer: "Traditional cards rely on binary self-grading. AI evaluation analyzes free-form or spoken answers for accuracy, semantic correctness, and completeness."
      }
    ]
  },
  {
    id: "deck-4",
    title: "React & TypeScript",
    description: "Component patterns, strict typing, hooks, state management, and performance optimization.",
    count: 32,
    due: 2,
    enabled: true,
    cards: []
  },
  {
    id: "deck-5",
    title: "Cloud Infrastructure",
    description: "Serverless, container orchestration, CI/CD pipelines, and cloud security.",
    count: 20,
    due: 0,
    enabled: true,
    cards: []
  }
]

interface DummyDecksProps {
  decks: Deck[]
  editingDeckId: string | null
  onSelectDeck: (deckId: string) => void
  onToggleDeckEnabled: (deckId: string) => void
  onCreateNewDeck: () => void
}

export function DummyDecks({
  decks,
  editingDeckId,
  onSelectDeck,
  onToggleDeckEnabled,
  onCreateNewDeck,
}: DummyDecksProps) {
  const activeCount = decks.filter(d => d.enabled).length

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          Your Decks
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {activeCount} Active
          </span>
        </h3>
      </div>
      <div className="space-y-3 overflow-y-auto max-h-[300px] sm:max-h-[420px] lg:max-h-[520px] pr-1 scrollbar-thin">
        {decks.map((deck) => {
          const isEditing = editingDeckId === deck.id
          return (
            <div
              key={deck.id}
              onClick={() => onSelectDeck(deck.id)}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group ${
                isEditing
                  ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-sm"
                  : !deck.enabled
                    ? "border-border/50 bg-secondary/10 opacity-60 hover:opacity-80"
                    : "border-border hover:border-primary/30 bg-card hover:bg-secondary/20"
              }`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <h4 className={`font-semibold text-sm truncate ${!deck.enabled ? "text-muted-foreground line-through decoration-muted-foreground/40" : "text-foreground"}`}>
                    {deck.title}
                  </h4>
                  {isEditing && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.5 rounded bg-primary/15 shrink-0">
                      Editing
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{deck.count} cards</span>
              </div>

              <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                {deck.due > 0 && deck.enabled && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {deck.due} due
                  </span>
                )}

                {/* Toggle slide button */}
                <button
                  type="button"
                  onClick={() => onToggleDeckEnabled(deck.id)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    deck.enabled ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Toggle ${deck.title}`}
                  title={deck.enabled ? "Deck active for study" : "Deck disabled"}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-xs ${
                      deck.enabled ? "translate-x-4.5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )
        })}

        <button
          onClick={onCreateNewDeck}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-primary/50 bg-background/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-200 active:scale-98 font-medium text-sm shadow-sm group cursor-pointer"
          aria-label="Create New Deck"
          title="Create New Deck"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
            <Plus className="h-4 w-4" />
          </div>
          <span>Create New Deck</span>
        </button>
      </div>
    </div>
  )
}
