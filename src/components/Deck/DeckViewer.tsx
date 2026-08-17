import { useState } from "react"
import { Sparkles, Plus, Trash2, Search, X, Pencil, Check, Layers } from "lucide-react"
import type { Deck } from "./Deck"
import { AddFlashcardModal } from "../Flashcard/AddFlashcardModal"
import { EditFlashcardModal } from "../Flashcard/EditFlashcardModal"
import type { Flashcard } from "../Flashcard/Flashcard"

interface DeckViewerProps {
  currentDeck: Deck
  onClose: () => void
  onUpdateDeck: (deckId: string, updates: Partial<Deck>) => void
  onAddCard: (deckId: string, card: Flashcard) => void
  onDeleteCard: (deckId: string, cardId: string) => void
}

export function DeckViewer({
  currentDeck,
  onClose,
  onUpdateDeck,
  onAddCard,
  onDeleteCard,
}: DeckViewerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [selectedCardForEdit, setSelectedCardForEdit] = useState<Flashcard | null>(null)

  const handleUpdateCard = (updatedCard: Flashcard) => {
    const updatedCards = currentDeck.cards.map((c) =>
      c.id === updatedCard.id ? updatedCard : c
    )
    onUpdateDeck(currentDeck.id, { cards: updatedCards })
  }

  const filteredCards = currentDeck.cards.filter((card) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase().trim()
    return (
      card.question.toLowerCase().includes(query) ||
      card.answer.toLowerCase().includes(query) ||
      card.label.toLowerCase().includes(query)
    )
  })

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm transition-all duration-300 relative overflow-hidden space-y-6">
      {/* Viewer Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <Layers className="h-5 w-5 text-primary shrink-0" />
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={currentDeck.title}
                  onChange={(e) => onUpdateDeck(currentDeck.id, { title: e.target.value })}
                  className="rounded-xl border border-border bg-background px-3 py-1 text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all max-w-[160px] sm:max-w-[240px]"
                  placeholder="Deck Title"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingTitle(false)
                    }
                  }}
                />
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all cursor-pointer shrink-0"
                  title="Save Title"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/title">
                <h2 className="font-display text-xl font-bold text-foreground max-w-[160px] sm:max-w-[280px] truncate">
                  {currentDeck.title}
                </h2>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0"
                  title="Edit Title"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={() => onUpdateDeck(currentDeck.id, { enabled: !currentDeck.enabled })}
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 cursor-pointer select-none transition-all active:scale-95 ${currentDeck.enabled
                ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              title={currentDeck.enabled ? "Click to Disable Deck" : "Click to Enable Deck"}
            >
              {currentDeck.enabled ? "Active" : "Disabled"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
            title="Close Deck"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Description Section */}
      {isEditingDescription ? (
        <div className="flex items-start gap-2 w-full bg-secondary/35 p-3 rounded-2xl border border-border/40">
          <textarea
            value={currentDeck.description || ""}
            onChange={(e) => onUpdateDeck(currentDeck.id, { description: e.target.value })}
            rows={2}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
            placeholder="Brief description of deck subject..."
            autoFocus
          />
          <button
            onClick={() => setIsEditingDescription(false)}
            className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all cursor-pointer shrink-0"
            title="Save Description"
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-2 group/desc bg-secondary/35 p-3 rounded-2xl border border-border/40 min-h-[46px]">
          <p className="text-xs text-muted-foreground/90 px-1 py-0.5 flex-1 whitespace-pre-wrap leading-relaxed">
            {currentDeck.description ? (
              currentDeck.description
            ) : (
              <span className="text-muted-foreground/40 italic">No description provided. Click the edit icon to add a description.</span>
            )}
          </p>
          <button
            onClick={() => setIsEditingDescription(true)}
            className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0"
            title="Edit Description"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
          <div className="grid grid-cols-[repeat(auto-fill,120px)] gap-3 justify-center sm:justify-start max-h-[300px] sm:max-h-[420px] overflow-y-auto pr-1 mt-3 py-4 px-1">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                onClick={() => setSelectedCardForEdit(card)}
                className="relative group border border-white/10 bg-gradient-to-br from-purple-800/50 to-neutral-800 rounded-xl p-3 flex flex-col items-center justify-center text-center w-[120px] h-[120px] transition-all duration-300 ease-out hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20 shadow-md shadow-black/35 cursor-pointer active:scale-95"
              >
                <span className="font-semibold text-xs text-white line-clamp-3 break-words w-full px-1 block">
                  {card.question}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteCard(currentDeck.id, card.id)
                  }}
                  className="absolute top-1.5 right-1.5 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer shrink-0"
                  title="Delete Flashcard"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
        deckId={currentDeck.id}
      />

      {/* Edit Flashcard Modal */}
      <EditFlashcardModal
        isOpen={selectedCardForEdit !== null}
        onClose={() => setSelectedCardForEdit(null)}
        card={selectedCardForEdit ? currentDeck.cards.find(c => c.id === selectedCardForEdit.id) || null : null}
        onUpdateCard={handleUpdateCard}
      />
    </div>
  )
}
