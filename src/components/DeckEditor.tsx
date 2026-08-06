import { useState } from "react"
import { ArrowRight, Sparkles, Plus, Trash2, Search, X } from "lucide-react"
import type { Deck } from "./DummyDecks"
import type { Flashcard } from "./DummyFlashCard"
import { AddFlashcardModal } from "./AddFlashcardModal"

interface DeckEditorProps {
  currentDeck: Deck
  onClose: () => void
  onUpdateDeck: (deckId: string, updates: Partial<Deck>) => void
  onAddCard: (deckId: string, card: Flashcard) => void
  onDeleteCard: (deckId: string, cardId: string) => void
}

export function DeckEditor({
  currentDeck,
  onClose,
  onUpdateDeck,
  onAddCard,
  onDeleteCard,
}: DeckEditorProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCards = currentDeck.cards.filter((card) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase().trim()
    return (
      card.question.toLowerCase().includes(query) ||
      card.answer.toLowerCase().includes(query) ||
      card.category.toLowerCase().includes(query)
    )
  })

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm transition-all duration-300 relative overflow-hidden space-y-6">
      {/* Editor Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            title="Back to Study Mode"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-foreground">Deck Editor</h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${currentDeck.enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                {currentDeck.enabled ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Manage deck settings and flashcards</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all shadow-sm shadow-primary/20 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Study This Deck
          </button>
        </div>
      </div>

      {/* Deck Information */}
      <div className="space-y-4 rounded-2xl border border-border/60 bg-background/50 p-4 sm:p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deck Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground">Deck Title</label>
            <input
              type="text"
              value={currentDeck.title}
              onChange={(e) => onUpdateDeck(currentDeck.id, { title: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Deck Title"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <textarea
              value={currentDeck.description || ""}
              onChange={(e) => onUpdateDeck(currentDeck.id, { description: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
              placeholder="Brief description of deck subject..."
            />
          </div>
        </div>
      </div>

      {/* Flashcard List Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Flashcards ({filteredCards.length}{searchQuery ? ` / ${currentDeck.cards.length}` : ""})
          </h3>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Flashcard
          </button>
        </div>

        {/* Search Input Field */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flashcards by title or content..."
            className="w-full rounded-xl border border-border bg-background pl-9 pr-9 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Card Items List */}
        {filteredCards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {searchQuery ? "No flashcards match your search." : "No flashcards in this deck yet."}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {searchQuery ? "Try searching for a different keyword or clear the search query." : 'Click "+ Add Flashcard" above to create your first question.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] sm:max-h-[420px] overflow-y-auto pr-1">
            {filteredCards.map((card, idx) => (
              <div
                key={card.id}
                className="rounded-2xl border border-border bg-background p-4 flex items-start justify-between gap-3 relative group hover:border-primary/30 transition-all shadow-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                      {card.category}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${card.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-500" :
                      card.difficulty === "Medium" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                      }`}>
                      {card.difficulty}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-foreground">{card.question}</h4>
                </div>
                <button
                  onClick={() => onDeleteCard(currentDeck.id, card.id)}
                  className="text-muted-foreground hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                  title="Delete Flashcard"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Flashcard Modal */}
      <AddFlashcardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCard={(newCard) => onAddCard(currentDeck.id, newCard)}
      />
    </div>
  )
}


