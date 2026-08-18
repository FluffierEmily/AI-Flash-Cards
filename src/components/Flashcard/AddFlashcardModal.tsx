import React, { useState, useEffect } from "react"
import { Plus, X, Check, GripVertical, Trash2 } from "lucide-react"
import type { Flashcard, Difficulty } from "./Flashcard"
import { RichTextEditor } from "../RichTextEditor/RichTextEditor"
import { loadDecks, saveDecks } from "../../lib/deckStorage"

interface AddFlashcardModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCard: (card: Flashcard) => void
  deckId: string
}

export function AddFlashcardModal({
  isOpen,
  onClose,
  onAddCard,
  deckId,
}: AddFlashcardModalProps) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [label, setLabel] = useState("General")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [hints, setHints] = useState<string[]>([])
  const [newHint, setNewHint] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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
    }
  }, [isOpen])

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
    if (!question.trim() || !answer.trim()) return

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

          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Official Answer <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. State is managed within the component, while props are passed into it..."
              className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Hints Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Hints (Drag to reorder)
            </label>

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
              disabled={!question.trim() || !answer.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-40 hover:opacity-95 transition-all shadow-sm cursor-pointer"
            >
              <Check className="h-4 w-4" />
              Save Flashcard
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
