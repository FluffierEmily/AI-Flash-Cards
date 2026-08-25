import React, { useState, useEffect } from "react"
import { Plus, X, Check, GripVertical, Trash2, Sparkles, Settings as SettingsIcon, RefreshCw } from "lucide-react"
import type { Flashcard, Difficulty } from "../Flashcard/Flashcard"
import { RichTextEditor } from "../RichTextEditor/RichTextEditor"
import { loadDecks, saveDecks } from "../../lib/deckStorage"
import { ModelSelectorModal } from "./ModelSelectorModal"
import { PinDecryptModal } from "./PinDecryptModal"
import type { SettingsState } from "../../pages/Settings"
import { getModelInstance } from "../../lib/ai"
import { generateHints } from "../../lib/aiHints"

interface AddFlashcardModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCard: (card: Flashcard) => void
  deckId: string
  settings: SettingsState
  decryptedKeys: Record<string, string>
  setDecryptedKeys: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

export function AddFlashcardModal({
  isOpen,
  onClose,
  onAddCard,
  deckId,
  settings,
  decryptedKeys,
  setDecryptedKeys
}: AddFlashcardModalProps) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const isAnswerEmpty = !answer.replace(/<[^>]*>/g, "").trim()
  const [label, setLabel] = useState("General")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [hints, setHints] = useState<string[]>([])
  const [newHint, setNewHint] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const [isGeneratingHints, setIsGeneratingHints] = useState(false)
  const [hintProgress, setHintProgress] = useState(0)
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [pinModalProvider, setPinModalProvider] = useState("")

  let [hintProvider, setHintProvider] = useState(() => localStorage.getItem("ai_hint_provider") || "")
  let [hintModel, setHintModel] = useState(() => localStorage.getItem("ai_hint_model") || "")

  // Reset form state when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setQuestion("")
      setAnswer("")
      setLabel("General")
      setDifficulty("medium")
      setHints([])
      setNewHint("")
      setDraggedIndex(null)
      setDragOverIndex(null)
      setIsGeneratingHints(false)
      setHintProgress(0)
      setIsModelSelectorOpen(false)
      setIsPinModalOpen(false)
    }
  }, [isOpen])

  useEffect(() => {
    let intervalId: any
    if (isGeneratingHints) {
      setHintProgress(0)
      intervalId = setInterval(() => {
        setHintProgress((prev) => {
          const remaining = 100 - prev
          const step = remaining * 0.08
          return Math.min(prev + step, 99.9)
        })
      }, 100)
    } else {
      setHintProgress(0)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isGeneratingHints])

  const runRealHintGeneration = async (apiKey: string) => {
    setIsGeneratingHints(true)
    const provider = hintProvider || settings.aiModelProvider
    const modelName = hintModel || settings.aiModelName
    const count = 3 - hints.length

    try {
      const model = getModelInstance(provider, modelName, apiKey)
      const generated = await generateHints(question, answer, count, model, settings.aiHintPrompt)
      setHints((prev) => [...prev, ...generated.slice(0, count)])
    } catch (err: any) {
      console.error("AI Hint Generation failed:", err)
      alert(`AI Hint Generation failed: ${err.message || err}`)
    } finally {
      setIsGeneratingHints(false)
    }
  }

  const triggerHintGeneration = async () => {
    const count = 3 - hints.length
    if (count <= 0 || !question.trim() || isAnswerEmpty) return

    const provider = hintProvider || settings.aiModelProvider

    const existingKey = decryptedKeys[provider.toLowerCase()]
    if (existingKey) {
      await runRealHintGeneration(existingKey)
    } else {
      setPinModalProvider(provider)
      setIsPinModalOpen(true)
    }
  }

  if (!isOpen) return null

  const addHint = () => {
    const textContent = newHint.replace(/<[^>]*>/g, "").trim()
    if (!textContent) return
    setHints([...hints, newHint.trim()])
    setNewHint("")
  }

  const removeHint = (index: number) => {
    setHints(hints.filter((_, i) => i !== index))
  }

  // Drag and Drop reordering handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const updated = [...hints]
    const [draggedItem] = updated.splice(draggedIndex, 1)
    updated.splice(index, 0, draggedItem)
    setHints(updated)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!question.trim() || isAnswerEmpty) return

    const newCard: Flashcard = {
      id: Date.now().toString(),
      deckId: deckId,
      question: question.trim(),
      answer: answer.trim(),
      label: label.trim() || "General",
      difficulty: difficulty,
      hints: hints.length > 0 ? hints : undefined,
    }

    loadDecks()
      .then((decks) => {
        const updatedDecks = decks.map((d) => {
          if (d.id === deckId) {
            return {
              ...d,
              cards: [...d.cards, newCard]
            }
          }
          return d
        })
        return saveDecks(updatedDecks)
      })
      .catch((err) => {
        console.error("Failed to auto-save added flashcard to IndexedDB", err)
      })

    onAddCard(newCard)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200 cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-[2rem] border border-border bg-card p-6 sm:p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6 sm:space-y-8"
        role="dialog"
        aria-labelledby="add-card-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-5 sm:pb-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 id="add-card-modal-title" className="font-display text-xl font-bold text-foreground sm:text-2xl">
                Add New Flashcard
              </h3>
              <p className="text-xs text-muted-foreground">Create a custom prompt and answer for this deck</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-6 sm:space-y-8">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Question / Prompt <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is the difference between state and props in React?"
              className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y min-h-[80px]"
              rows={3}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Official Answer <span className="text-rose-500">*</span>
            </label>
            <RichTextEditor
              value={answer}
              onChange={setAnswer}
              placeholder="e.g. State is managed within the component, while props are passed into it..."
            />
          </div>

          {/* Hints Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-semibold text-foreground">
                Hints (Drag to reorder)
              </label>

              <div className="flex items-center gap-2">
                {/* Generate Hints Button with Shimmer Progress */}
                <button
                  type="button"
                  onClick={triggerHintGeneration}
                  disabled={isGeneratingHints || hints.length >= 3 || !question.trim() || isAnswerEmpty}
                  className={`relative overflow-hidden flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all duration-200 active:scale-95 shadow-sm ${isGeneratingHints
                    ? "pointer-events-none opacity-100 animate-gradient-shimmer"
                    : hints.length >= 3 || !question.trim() || isAnswerEmpty
                      ? "bg-primary opacity-40 pointer-events-none"
                      : "bg-primary cursor-pointer hover:opacity-95"
                    }`}
                  title={
                    !question.trim() || isAnswerEmpty
                      ? "Enter question and answer to generate hints"
                      : hints.length >= 3
                        ? "Max 3 hints reached"
                        : `Generate ${3 - hints.length} hint(s) automatically`
                  }
                >
                  {isGeneratingHints && (
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-violet-200/10 to-violet-200/65 transition-all duration-100 ease-out pointer-events-none overflow-hidden"
                      style={{ width: `${hintProgress}%` }}
                    >
                      <div className="absolute inset-0 w-full h-full shimmer-bar animate-shimmer-sweep" />
                      <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-violet-200 shadow-[0_0_8px_#e9d5ff]" />
                    </div>
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {isGeneratingHints ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Generating ({Math.round(hintProgress)}%)...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate {3 - hints.length} Hint{3 - hints.length > 1 ? "s" : ""}
                      </>
                    )}
                  </span>
                </button>

                {/* Settings gear icon for overrides */}
                <button
                  type="button"
                  onClick={() => setIsModelSelectorOpen(true)}
                  className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                  title={`Configure AI Model for Hints (Current: ${hintProvider || settings.aiModelProvider} - ${hintModel || settings.aiModelName})`}
                >
                  <SettingsIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* List of current hints */}
            {hints.length > 0 && (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {hints.map((hint, index) => {
                  const isDragging = draggedIndex === index
                  const isOver = dragOverIndex === index
                  return (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all select-none duration-150 ${isDragging
                        ? "opacity-40 border-dashed border-muted-foreground bg-muted/20"
                        : isOver
                          ? "border-primary bg-primary/5 scale-[1.01]"
                          : "border-border bg-background/50 hover:bg-background/80"
                        }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded text-muted-foreground transition-colors"
                          title="Drag to reorder"
                        >
                          <GripVertical className="h-4 w-4 shrink-0" />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground select-none">
                          #{index + 1}
                        </span>
                        <div
                          className="text-xs text-foreground truncate flex-1 leading-normal prose dark:prose-invert max-w-none [&_p]:m-0"
                          dangerouslySetInnerHTML={{ __html: hint }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeHint(index)}
                        className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                        title="Delete Hint"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Rich Text Editor to add a new hint */}
            <div className="space-y-2">
              <RichTextEditor
                value={newHint}
                onChange={setNewHint}
                placeholder="Add a hint to help recall the answer..."
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addHint}
                  disabled={!newHint.replace(/<[^>]*>/g, "").trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40 hover:opacity-95 transition-all shadow-sm cursor-pointer"
                  title="Add Hint"
                >
                  <Plus className="h-4 w-4" />
                  Add Hint
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="label (e.g. React, Science)"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3.5 pt-5 sm:pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!question.trim() || isAnswerEmpty}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-40 hover:opacity-95 transition-all shadow-sm cursor-pointer"
            >
              <Check className="h-4 w-4" />
              Save Flashcard
            </button>
          </div>
        </form>
      </div>

      {/* AI Model Selector for Hints */}
      <ModelSelectorModal
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        settings={settings}
        overrideProvider={hintProvider}
        overrideModel={hintModel}
        onUpdateOverride={(provider, model) => {
          if (provider === "") {
            localStorage.removeItem("ai_hint_provider")
            localStorage.removeItem("ai_hint_model")
            setHintProvider("")
            setHintModel("")
          } else {
            localStorage.setItem("ai_hint_provider", provider)
            localStorage.setItem("ai_hint_model", model)
            setHintProvider(provider)
            setHintModel(model)
          }
        }}
        decryptedKeys={decryptedKeys}
      />

      {/* PIN Decrypt / BYOK Modal */}
      <PinDecryptModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        provider={pinModalProvider}
        onKeySuccess={(apiKey) => {
          runRealHintGeneration(apiKey)
        }}
        setDecryptedKeys={setDecryptedKeys}
      />
    </div>
  )
}
