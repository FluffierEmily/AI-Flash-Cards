import React, { useState, useEffect } from "react"
import { Plus, X, Check } from "lucide-react"
import type { Flashcard } from "./DummyFlashCard"

interface AddFlashcardModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCard: (card: Flashcard) => void
}

export function AddFlashcardModal({
  isOpen,
  onClose,
  onAddCard,
}: AddFlashcardModalProps) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [category, setCategory] = useState("General")
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium")

  // Reset form state when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setQuestion("")
      setAnswer("")
      setCategory("General")
      setDifficulty("Medium")
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!question.trim() || !answer.trim()) return

    const newCard: Flashcard = {
      id: Date.now().toString(),
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim() || "General",
      difficulty: difficulty,
    }

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
        className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5"
        role="dialog"
        aria-labelledby="add-card-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 id="add-card-modal-title" className="font-display text-lg font-bold text-foreground">
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
        <form onSubmit={handleSave} className="space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category (e.g. React, Science)"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "Easy" | "Medium" | "Hard")}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!question.trim() || !answer.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40 hover:opacity-95 transition-all shadow-sm cursor-pointer"
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
