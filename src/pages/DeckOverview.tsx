import { useState, useEffect } from "react"
import { Plus, Trash2, Search, X, Pencil, Check, Layers, Play, Sparkles, RefreshCw, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { DeckList } from "../components/Deck/Decks"
import type { Deck } from "../components/Deck/Deck"
import { AddFlashcardModal } from "../components/modals/AddFlashcardModal"
import { EditFlashcardModal } from "../components/modals/EditFlashcardModal"
import { CardReviewHistory } from "../components/Flashcard/CardReviewHistory"
import type { Flashcard } from "../components/Flashcard/Flashcard"
import type { SettingsState } from "./Settings"
import { generateCards } from "../lib/aiCardGenerator"
import { getModelInstance } from "../lib/ai"
import { PinDecryptModal } from "../components/modals/PinDecryptModal"

interface DeckOverviewPageProps {
  decks: Deck[]
  editingDeckId: string | null
  onSelectDeck: (deckId: string) => void
  onToggleDeckEnabled: (deckId: string) => void
  onCreateNewDeck: () => void
}

export function DeckOverview({
  decks,
  editingDeckId,
  onSelectDeck,
  onToggleDeckEnabled,
  onCreateNewDeck
}: DeckOverviewPageProps) {
  const navigate = useNavigate()
  return (
    <div className="max-w-2xl mx-auto w-full">
      <DeckList
        decks={decks}
        editingDeckId={editingDeckId}
        onSelectDeck={onSelectDeck}
        onToggleDeckEnabled={onToggleDeckEnabled}
        onCreateNewDeck={onCreateNewDeck}
        onClose={() => navigate("/dashboard")}
      />
    </div>
  )
}

interface DeckViewerProps {
  currentDeck: Deck
  onClose: () => void
  onUpdateDeck: (deckId: string, updates: Partial<Deck>) => void
  onAddCard: (deckId: string, card: Flashcard) => void
  onDeleteCard: (deckId: string, cardId: string) => void
  onStartReviewDeck?: (deckId: string) => void
  dueCount?: number
  onDeleteDeck: (deckId: string) => void
  settings: SettingsState
  decryptedKeys: Record<string, string>
  setDecryptedKeys: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

export function DeckViewer({
  currentDeck,
  onClose,
  onUpdateDeck,
  onAddCard,
  onDeleteCard,
  onStartReviewDeck,
  dueCount,
  onDeleteDeck,
  settings,
  decryptedKeys,
  setDecryptedKeys,
}: DeckViewerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [selectedCardForEdit, setSelectedCardForEdit] = useState<Flashcard | null>(null)
  const [selectedCardForHistory, setSelectedCardForHistory] = useState<Flashcard | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [isGeneratingCards, setIsGeneratingCards] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [customInstructions, setCustomInstructions] = useState("")
  const [includeExistingAsContext, setIncludeExistingAsContext] = useState(true)
  const [shouldGenerateHints, setShouldGenerateHints] = useState(true)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [pinModalProvider, setPinModalProvider] = useState("")
  const [preferredDifficulty, setPreferredDifficulty] = useState("")
  const [preferredLabel, setPreferredLabel] = useState("")
  const [generationProgress, setGenerationProgress] = useState(0)
  const [cardCount, setCardCount] = useState(10)

  const isGenerationDisabled = isGeneratingCards || currentDeck.title.toLowerCase().includes("deck")

  useEffect(() => {
    let intervalId: any
    if (isGeneratingCards) {
      setGenerationProgress(0)
      intervalId = setInterval(() => {
        setGenerationProgress((prev) => {
          const remaining = 100 - prev
          const step = remaining * 0.05
          return Math.min(prev + step, 99.9)
        })
      }, 200)
    } else {
      setGenerationProgress(0)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isGeneratingCards])

  const triggerCardGenerationFlow = () => {
    if (isGenerationDisabled) return
    setIsConfirmModalOpen(true)
  }

  const handleConfirmGeneration = () => {
    setIsConfirmModalOpen(false)
    const provider = settings.aiModelProvider
    const existingKey = decryptedKeys[provider.toLowerCase()]

    if (existingKey) {
      runRealCardGeneration(existingKey, shouldGenerateHints)
    } else {
      setPinModalProvider(provider)
      setIsPinModalOpen(true)
    }
  }

  const runRealCardGeneration = async (apiKey: string, genHints: boolean) => {
    setIsGeneratingCards(true)
    try {
      const provider = settings.aiModelProvider
      const modelName = settings.aiModelName
      const model = getModelInstance(provider, modelName, apiKey)

      const existingContext = includeExistingAsContext ? currentDeck.cards : []

      const newCards = await generateCards(
        currentDeck.title,
        currentDeck.description || "",
        existingContext,
        genHints,
        model,
        customInstructions,
        settings.aiHintPrompt,
        preferredDifficulty || undefined,
        preferredLabel || undefined,
        cardCount
      )

      const processedCards = newCards.map((cardData: any, idx: number) => ({
        id: (Date.now() + idx).toString(),
        deckId: currentDeck.id,
        question: cardData.question.replace(/<[^>]*>/g, "").trim(),
        answer: cardData.answer,
        label: cardData.label || "",
        difficulty: cardData.difficulty || "medium",
        hints: cardData.hints,
      }))

      const updatedCards = [...currentDeck.cards, ...processedCards]
      onUpdateDeck(currentDeck.id, { cards: updatedCards })

      setCustomInstructions("")
      // Reset difficulty and label preferences on successful generation
      setPreferredDifficulty("")
      setPreferredLabel("")
    } catch (err: any) {
      console.error("AI Card Generation failed:", err)
      alert(`AI Card Generation failed: ${err.message || err}`)
    } finally {
      setIsGeneratingCards(false)
    }
  }

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
          {onStartReviewDeck && dueCount !== undefined && dueCount > 0 && (
            <button
              onClick={() => onStartReviewDeck(currentDeck.id)}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm shadow-primary/20"
              title="Review due cards in this deck"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Review ({dueCount})</span>
            </button>
          )}
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
        {currentDeck.cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-2xl bg-background/50 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              No flashcards in this deck yet.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="relative group border border-dashed border-muted-foreground/40 hover:border-primary/50 bg-secondary/15 hover:bg-secondary/35 rounded-xl flex flex-col items-center justify-center w-[120px] h-[120px] transition-all duration-300 ease-out hover:shadow-lg hover:shadow-primary/5 cursor-pointer active:scale-95 text-muted-foreground hover:text-primary"
                title="Add Flashcard"
              >
                <Plus className="h-6 w-6 stroke-[2]" />
              </button>
              <button
                onClick={triggerCardGenerationFlow}
                disabled={isGenerationDisabled}
                className={`relative overflow-hidden group border rounded-xl flex flex-col items-center justify-center w-[120px] h-[120px] transition-all duration-300 ease-out active:scale-95 text-muted-foreground hover:text-primary ${isGeneratingCards
                  ? "pointer-events-none opacity-100 animate-gradient-shimmer"
                  : isGenerationDisabled
                    ? "border-dashed border-muted-foreground/20 bg-secondary/5 opacity-40 pointer-events-none"
                    : "border-dashed border-muted-foreground/40 hover:border-primary/50 bg-secondary/15 hover:bg-secondary/35 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
                  }`}
                title={currentDeck.title.toLowerCase().includes("deck") ? "Generation disabled because deck title includes 'deck'" : "Generate +X Cards"}
              >
                {isGeneratingCards && (
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-violet-200/10 to-violet-200/65 transition-all duration-100 ease-out pointer-events-none overflow-hidden"
                    style={{ width: `${generationProgress}%` }}
                  >
                    <div className="absolute inset-0 w-full h-full shimmer-bar animate-shimmer-sweep" />
                    <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-violet-200 shadow-[0_0_8px_#e9d5ff]" />
                  </div>
                )}
                <span className="relative z-10 flex flex-col items-center justify-center">
                  {isGeneratingCards ? (
                    <>
                      <RefreshCw className="h-6 w-6 stroke-[2] animate-spin text-primary-foreground" />
                      <span className="text-[10px] font-bold mt-1.5 text-primary-foreground">Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6 stroke-[2]" />
                      <span className="text-[10px] font-bold mt-1.5">Generate +X</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {searchQuery && filteredCards.length === 0 && (
              <p className="text-xs text-center text-muted-foreground py-2">
                No flashcards match your search.
              </p>
            )}
            <div className="grid grid-cols-[repeat(auto-fill,120px)] gap-3 justify-center sm:justify-start max-h-[300px] sm:max-h-[420px] overflow-y-auto pr-1 mt-3 py-4 px-1">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="relative group border border-dashed border-muted-foreground/40 hover:border-primary/50 bg-secondary/15 hover:bg-secondary/35 rounded-xl flex flex-col items-center justify-center w-[120px] h-[120px] transition-all duration-300 ease-out hover:shadow-lg hover:shadow-primary/5 cursor-pointer active:scale-95 text-muted-foreground hover:text-primary"
                title="Add Flashcard"
              >
                <Plus className="h-6 w-6 stroke-[2]" />
              </button>
              <button
                onClick={triggerCardGenerationFlow}
                disabled={isGenerationDisabled}
                className={`relative overflow-hidden group border rounded-xl flex flex-col items-center justify-center w-[120px] h-[120px] transition-all duration-300 ease-out active:scale-95 text-muted-foreground hover:text-primary ${isGeneratingCards
                  ? "pointer-events-none opacity-100 animate-gradient-shimmer"
                  : isGenerationDisabled
                    ? "border-dashed border-muted-foreground/20 bg-secondary/5 opacity-40 pointer-events-none"
                    : "border-dashed border-muted-foreground/40 hover:border-primary/50 bg-secondary/15 hover:bg-secondary/35 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
                  }`}
                title={currentDeck.title.toLowerCase().includes("deck") ? "Generation disabled because deck title includes 'deck'" : "Generate +X Cards"}
              >
                {isGeneratingCards && (
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-violet-200/10 to-violet-200/65 transition-all duration-100 ease-out pointer-events-none overflow-hidden"
                    style={{ width: `${generationProgress}%` }}
                  >
                    <div className="absolute inset-0 w-full h-full shimmer-bar animate-shimmer-sweep" />
                    <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-violet-200 shadow-[0_0_8px_#e9d5ff]" />
                  </div>
                )}
                <span className="relative z-10 flex flex-col items-center justify-center">
                  {isGeneratingCards ? (
                    <>
                      <RefreshCw className="h-6 w-6 stroke-[2] animate-spin text-primary-foreground" />
                      <span className="text-[10px] font-bold mt-1.5 text-primary-foreground">Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6 stroke-[2]" />
                      <span className="text-[10px] font-bold mt-1.5">Generate +X</span>
                    </>
                  )}
                </span>
              </button>
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedCardForEdit(card)}
                  className="relative group border border-white/10 bg-gradient-to-br from-purple-800/50 to-neutral-800 rounded-xl p-3 flex flex-col items-center justify-center text-center w-[120px] h-[120px] transition-all duration-300 ease-out hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20 shadow-md shadow-black/35 cursor-pointer active:scale-95"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCardForHistory(card)
                    }}
                    className="absolute top-1.5 left-1.5 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer shrink-0 z-10"
                    title="Review History"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                  </button>
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
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="border-t border-border/60 pt-6 mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500">Danger Zone</h4>
          <p className="text-xs text-muted-foreground mt-1">Permanently delete this deck and all of its flashcards.</p>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500 hover:text-white text-rose-500 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 shadow-sm shadow-rose-500/5 shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Entire Deck</span>
        </button>
      </div>

      {/* Add Flashcard Modal */}
      <AddFlashcardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCard={(newCard) => onAddCard(currentDeck.id, newCard)}
        deckId={currentDeck.id}
        settings={settings}
        decryptedKeys={decryptedKeys}
        setDecryptedKeys={setDecryptedKeys}
      />

      {/* Edit Flashcard Modal */}
      <EditFlashcardModal
        isOpen={selectedCardForEdit !== null}
        onClose={() => setSelectedCardForEdit(null)}
        card={selectedCardForEdit ? currentDeck.cards.find(c => c.id === selectedCardForEdit.id) || null : null}
        onUpdateCard={handleUpdateCard}
        settings={settings}
        decryptedKeys={decryptedKeys}
        setDecryptedKeys={setDecryptedKeys}
      />

      {/* Card Review History Modal */}
      <CardReviewHistory
        isOpen={selectedCardForHistory !== null}
        onClose={() => setSelectedCardForHistory(null)}
        card={selectedCardForHistory ? currentDeck.cards.find(c => c.id === selectedCardForHistory.id) || selectedCardForHistory : null}
        deckTitle={currentDeck.title}
      />

      {/* Generate +10 Cards Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div
            onClick={() => setIsConfirmModalOpen(false)}
            className="fixed inset-0 bg-background/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200 cursor-pointer"
            aria-hidden="true"
          />

          {/* Modal Dialog */}
          <div
            className="relative z-10 w-full max-w-xl rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 space-y-8 text-left"
            role="dialog"
            aria-labelledby="generate-cards-modal-title"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 id="generate-cards-modal-title" className="font-display text-lg font-bold text-foreground">
                  Generate {cardCount} Flashcards
                </h3>
              </div>
            </div>

            <p className="text-sm text-muted-foreground/90 leading-relaxed">
              Topic: <span className="font-semibold text-foreground">{currentDeck.title}</span>
            </p>

            {/* Card Count Selector */}
            <div className="space-y-2">
              <label htmlFor="card-count" className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Number of Cards to Generate</span>
                <span className="text-primary font-bold">{cardCount}</span>
              </label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCardCount(num)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${cardCount === num
                      ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    +{num}
                  </button>
                ))}
                <input
                  id="card-count"
                  type="number"
                  min={1}
                  max={50}
                  value={cardCount}
                  onChange={(e) => setCardCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className="w-16 rounded-xl border border-border bg-background px-2 py-2 text-xs font-semibold text-foreground text-center outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-1.5">
              <label htmlFor="custom-instructions" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                Custom Instructions (Optional)
              </label>
              <textarea
                id="custom-instructions"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="language, focus, etc."
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* Preferred Difficulty & Label */}
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label htmlFor="preferred-difficulty" className="text-xs font-semibold text-foreground block">
                  Desired Difficulty
                </label>
                <select
                  id="preferred-difficulty"
                  value={preferredDifficulty}
                  onChange={(e) => setPreferredDifficulty(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer h-9"
                >
                  <option value="">AI Decides</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="preferred-label" className="text-xs font-semibold text-foreground block">
                  Desired Label
                </label>
                <input
                  id="preferred-label"
                  type="text"
                  value={preferredLabel}
                  onChange={(e) => setPreferredLabel(e.target.value)}
                  placeholder="Theory, Coding-Pattern, etc."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all h-9"
                />
              </div>
            </div>

            {/* Toggles and Settings */}
            <div className="space-y-4">
              {/* Context Switch */}
              {currentDeck.cards.length > 0 && (
                <div className="flex items-center justify-between gap-4 bg-secondary/15 p-3 rounded-2xl border border-border/40">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-foreground block">
                      Prevent Duplicates
                    </label>
                    <span className="text-[10px] text-muted-foreground block leading-tight">
                      Use existing card questions as context for the AI.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeExistingAsContext(!includeExistingAsContext)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${includeExistingAsContext ? 'bg-primary' : 'bg-muted'
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${includeExistingAsContext ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>
              )}

              {/* Hints Switch */}
              <div className="flex items-center justify-between gap-4 bg-secondary/15 p-3 rounded-2xl border border-border/40">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-foreground block">
                    Generate Hints
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShouldGenerateHints(!shouldGenerateHints)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${shouldGenerateHints ? 'bg-primary' : 'bg-muted'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${shouldGenerateHints ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGeneration}
                className="px-5 py-2.5 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:opacity-95 active:scale-95 transition-all shadow-sm shadow-primary/20 cursor-pointer"
              >
                Generate {cardCount} Cards
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Decrypt / BYOK Modal */}
      <PinDecryptModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        provider={pinModalProvider}
        onKeySuccess={(apiKey) => {
          runRealCardGeneration(apiKey, shouldGenerateHints)
        }}
        setDecryptedKeys={setDecryptedKeys}
      />

      {/* Delete Deck Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div
            onClick={() => setShowDeleteConfirm(false)}
            className="fixed inset-0 bg-background/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200 cursor-pointer"
            aria-hidden="true"
          />

          {/* Modal Dialog */}
          <div
            className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6"
            role="dialog"
            aria-labelledby="delete-deck-modal-title"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 id="delete-deck-modal-title" className="font-display text-lg font-bold text-foreground">
                  Delete Deck
                </h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground/90 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{currentDeck.title}"</span>? All {currentDeck.cards.length} cards in this deck will be permanently removed.
            </p>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  onDeleteDeck(currentDeck.id)
                }}
                className="px-4 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all cursor-pointer"
              >
                Delete Deck
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-500 active:scale-95 transition-all shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
