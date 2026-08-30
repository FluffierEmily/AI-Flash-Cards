import { Plus, Layers, X, Upload } from "lucide-react"
import type { Deck } from "./Deck"

interface DeckListProps {
  decks: Deck[]
  editingDeckId: string | null
  onSelectDeck: (deckId: string) => void
  onToggleDeckEnabled: (deckId: string) => void
  onCreateNewDeck: () => void
  onImportDecks?: () => void
  onClose?: () => void
}

export function DeckList({
  decks,
  editingDeckId,
  onSelectDeck,
  onToggleDeckEnabled,
  onCreateNewDeck,
  onImportDecks,
  onClose,
}: DeckListProps) {
  const activeCount = decks.filter(d => d.enabled).length

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary shrink-0" />
          Your Decks
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {activeCount} Active
          </span>
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
            title="Close Decks"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="space-y-3 overflow-y-auto max-h-[300px] sm:max-h-[420px] lg:max-h-[520px] pr-1 scrollbar-thin">
        {decks.map((deck) => {
          const isEditing = editingDeckId === deck.id
          return (
            <div
              key={deck.id}
              onClick={() => onSelectDeck(deck.id)}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group ${isEditing
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
                  {/* Editing badge removed */}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-muted-foreground leading-none">{deck.cards.length} cards</span>
                  {deck.due > 0 && deck.enabled && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary leading-none">
                      {deck.due} due
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Toggle slide button */}
                <button
                  type="button"
                  onClick={() => onToggleDeckEnabled(deck.id)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${deck.enabled ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  aria-label={`Toggle ${deck.title}`}
                  title={deck.enabled ? "Deck active for study" : "Deck disabled"}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-xs ${deck.enabled ? "translate-x-4.5" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>
            </div>
          )
        })}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            onClick={onCreateNewDeck}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-muted-foreground/40 hover:border-primary/50 bg-background/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-200 active:scale-98 font-medium text-sm shadow-sm group cursor-pointer"
            aria-label="Create New Deck"
            title="Create New Deck"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
              <Plus className="h-4 w-4" />
            </div>
            <span>Create New Deck</span>
          </button>

          {onImportDecks && (
            <button
              onClick={onImportDecks}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-muted-foreground/40 hover:border-primary/50 bg-background/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all duration-200 active:scale-98 font-medium text-sm shadow-sm group cursor-pointer"
              aria-label="Import Decks"
              title="Import Decks"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                <Upload className="h-4 w-4" />
              </div>
              <span>Import Decks</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
