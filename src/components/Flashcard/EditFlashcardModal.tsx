import React, { useState, useEffect } from "react"
import { X, Check, Pencil, GripVertical, Trash2, Plus, Info } from "lucide-react"
import type { Flashcard, Difficulty } from "./Flashcard"
import { RichTextEditor } from "../RichTextEditor/RichTextEditor"

interface EditFlashcardModalProps {
  isOpen: boolean
  onClose: () => void
  card: Flashcard | null
  onUpdateCard: (updatedCard: Flashcard) => void
}

export function EditFlashcardModal({
  isOpen,
  onClose,
  card,
  onUpdateCard,
}: EditFlashcardModalProps) {
  // Toggle states for each field
  const [isEditingQuestion, setIsEditingQuestion] = useState(false)
  const [isEditingAnswer, setIsEditingAnswer] = useState(false)
  const [isEditingHints, setIsEditingHints] = useState(false)
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [isEditingDifficulty, setIsEditingDifficulty] = useState(false)

  // Local values
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [label, setLabel] = useState("General")
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [hints, setHints] = useState<string[]>([])
  const [newHint, setNewHint] = useState("")

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Sync state when card updates or modal opens
  useEffect(() => {
    if (isOpen && card) {
      setQuestion(card.question)
      setAnswer(card.answer)
      setLabel(card.label || "General")
      setDifficulty(card.difficulty)
      setHints(card.hints || [])
      setNewHint("")

      // Reset editing states
      setIsEditingQuestion(false)
      setIsEditingAnswer(false)
      setIsEditingHints(false)
      setIsEditingLabel(false)
      setIsEditingDifficulty(false)
    }
  }, [isOpen, card])

  if (!isOpen || !card) return null

  const addHint = () => {
    const textContent = newHint.replace(/<[^>]*>/g, "").trim()
    if (!textContent) return
    setHints([...hints, newHint.trim()])
    setNewHint("")
  }

  const removeHint = (index: number) => {
    setHints(hints.filter((_, i) => i !== index))
  }

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
        aria-labelledby="edit-card-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-5 sm:pb-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 id="edit-card-modal-title" className="font-display text-xl font-bold text-foreground sm:text-2xl">
                Flashcard Details
              </h3>
              <p className="text-xs text-muted-foreground">
                View and edit details
              </p>
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

        {/* Modal Content - Individual Editors */}
        <div className="space-y-6 sm:space-y-8">

          {/* Question Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Question / Prompt</span>
              {!isEditingQuestion ? (
                <button
                  onClick={() => setIsEditingQuestion(true)}
                  className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0"
                  title="Edit Question"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (question.trim()) {
                      onUpdateCard({ ...card, question: question.trim() })
                      setIsEditingQuestion(false)
                    }
                  }}
                  disabled={!question.trim()}
                  className="p-1 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all cursor-pointer disabled:opacity-40 shrink-0"
                  title="Save Question"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {isEditingQuestion ? (
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y min-h-[80px]"
                rows={3}
                autoFocus
              />
            ) : (
              <div className="w-full rounded-xl border border-border bg-secondary/15 p-4 text-sm font-semibold text-foreground whitespace-pre-wrap leading-relaxed">
                {question}
              </div>
            )}
          </div>

          {/* Answer Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Official Answer</span>
              {!isEditingAnswer ? (
                <button
                  onClick={() => setIsEditingAnswer(true)}
                  className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0"
                  title="Edit Answer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (answer.trim()) {
                      onUpdateCard({ ...card, answer: answer.trim() })
                      setIsEditingAnswer(false)
                    }
                  }}
                  disabled={!answer.trim()}
                  className="p-1 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all cursor-pointer disabled:opacity-40 shrink-0"
                  title="Save Answer"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {isEditingAnswer ? (
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y min-h-[80px]"
                rows={3}
                autoFocus
              />
            ) : (
              <div className="w-full rounded-xl border border-border bg-secondary/15 p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {answer}
              </div>
            )}
          </div>

          {/* Hints Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Hints</span>
              {!isEditingHints ? (
                <button
                  onClick={() => setIsEditingHints(true)}
                  className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0"
                  title="Edit Hints"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    onUpdateCard({ ...card, hints: hints.length > 0 ? hints : undefined })
                    setIsEditingHints(false)
                  }}
                  className="p-1 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all cursor-pointer shrink-0"
                  title="Save Hints"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isEditingHints ? (
              <div className="space-y-4">
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
            ) : (
              <div className="space-y-2">
                {hints.length > 0 ? (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {hints.map((hint, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2.5 p-3 rounded-xl border border-border bg-secondary/10 text-xs text-foreground leading-normal"
                      >
                        <span className="font-mono text-muted-foreground select-none">#{idx + 1}</span>
                        <div
                          className="prose dark:prose-invert max-w-none text-xs flex-1 [&_p]:m-0"
                          dangerouslySetInnerHTML={{ __html: hint }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground/50 italic px-1">
                    No hints provided. Click the edit icon to add.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Badges and Settings grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Label Block */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-muted-foreground block">label</span>
                {!isEditingLabel ? (
                  <button
                    onClick={() => setIsEditingLabel(true)}
                    className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0"
                    title="Edit label"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const finalLabel = label.trim() || "General"
                      setLabel(finalLabel)
                      onUpdateCard({ ...card, label: finalLabel })
                      setIsEditingLabel(false)
                    }}
                    className="p-1 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all cursor-pointer shrink-0"
                    title="Save label"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                )}
              </div>
              {isEditingLabel ? (
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="label (e.g. React, Science)"
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  autoFocus
                />
              ) : (
                <div>
                  <span className="inline-block rounded-lg bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    {label}
                  </span>
                </div>
              )}
            </div>

            {/* Difficulty Block */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-muted-foreground block">Difficulty</span>
                {!isEditingDifficulty ? (
                  <button
                    onClick={() => setIsEditingDifficulty(true)}
                    className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0"
                    title="Edit Difficulty"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onUpdateCard({ ...card, difficulty: difficulty })
                      setIsEditingDifficulty(false)
                    }}
                    className="p-1 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all cursor-pointer shrink-0"
                    title="Save Difficulty"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                )}
              </div>
              {isEditingDifficulty ? (
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  autoFocus
                >
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              ) : (
                <div>
                  <span
                    className={`inline-block rounded-lg px-3 py-1 text-xs font-semibold ${difficulty === "easy"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : difficulty === "medium"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-rose-500/10 text-rose-500"
                      }`}
                  >
                    {difficulty}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3.5 pt-5 sm:pt-6 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
