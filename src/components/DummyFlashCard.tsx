import { useState, useRef, useEffect } from "react"
import { RefreshCw, Sparkles, CheckCircle2, RotateCcw, Meh, Smile, Zap, ArrowLeft } from "lucide-react"
import { RichTextEditor } from "./RichTextEditor/RichTextEditor"

export interface Flashcard {
  id: string
  question: string
  answer: string
  category: string
  difficulty?: string
}

export const SAMPLE_CARDS: Flashcard[] = [
  {
    id: "1",
    category: "System Architecture",
    question: "What is Spaced Repetition?",
    answer: "A learning technique where flashcards are scheduled for review at increasing intervals based on how well you remember them. It exploits the psychological spacing effect to maximize retention."
  },
  {
    id: "2",
    category: "Progressive Web Apps",
    question: "Explain Offline-First Architecture",
    answer: "A design pattern where all data read/write operations are performed against a local database (like IndexedDB) first. Background synchronization handles syncing with server endpoints when online, ensuring the app works without internet."
  },
  {
    id: "3",
    category: "AI & LLMs",
    question: "How can LLMs be used to enhance flashcards?",
    answer: "Traditional cards rely on binary self-grading. AI evaluation analyzes free-form or spoken answers for accuracy, semantic correctness, and completeness, providing detailed corrective feedback."
  }
]

interface DummyFlashCardProps {
  onClose?: () => void
}

export function DummyFlashCard({ onClose }: DummyFlashCardProps = {}) {
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [userAnswer, setUserAnswer] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evalResult, setEvalResult] = useState<{ score: number; feedback: string } | null>(null)

  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const activeElement = isFlipped ? backRef.current : frontRef.current
    if (!activeElement) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setCardHeight(entry.target.getBoundingClientRect().height)
      }
    })

    resizeObserver.observe(activeElement)
    return () => resizeObserver.disconnect()
  }, [isFlipped, userAnswer, evalResult, activeCardIndex])

  const activeCard = SAMPLE_CARDS[activeCardIndex]

  const handleNextCard = () => {
    setIsFlipped(false)
    setEvalResult(null)
    setUserAnswer("")
    setActiveCardIndex((prev) => (prev + 1) % SAMPLE_CARDS.length)
  }

  const simulateAIEvaluation = () => {
    const cleanUserAnswer = userAnswer.replace(/<[^>]*>/g, "").trim()
    if (!cleanUserAnswer) return
    setIsEvaluating(true)
    setTimeout(() => {
      setIsEvaluating(false)
      const lengthScore = Math.min(100, Math.round((cleanUserAnswer.length / activeCard.answer.length) * 100))
      const score = Math.max(10, Math.min(100, lengthScore + Math.floor(Math.random() * 20 - 10)))

      let feedback = ""
      if (score >= 80) {
        feedback = "Excellent! You captured the main concept accurately and provided solid context. Keep it up!"
      } else if (score >= 50) {
        feedback = "Good attempt. You got the core idea, but missed a few key details. Check the answer key below to improve."
      } else {
        feedback = "A bit incomplete. Focus on explaining the mechanism or core principles mentioned in the full answer."
      }
      setEvalResult({ score, feedback })
      setIsFlipped(true)
    }, 1200)
  }

  return (
    <div
      className="perspective-1000 w-full transition-all duration-500 ease-in-out relative"
      style={{ height: cardHeight ? `${cardHeight}px` : "auto" }}
    >
      <div
        className={`relative w-full h-full transform-style-3d transition-transform duration-700 ease-in-out ${isFlipped ? "rotate-y-180" : ""
          }`}
      >
        {/* Front Side */}
        <div
          ref={frontRef}
          className="absolute top-0 left-0 w-full rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm backface-hidden"
          style={{
            pointerEvents: isFlipped ? "none" : "auto",
          }}
        >
          <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />

          {/* Card Meta Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="mr-1 p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Back to Dashboard"
                  aria-label="Back to Dashboard"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              Review Flash Card
            </h3>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {activeCard.category}
              </span>
            </div>
          </div>

          {/* Card Body - Front */}
          <div className="min-h-[160px] flex flex-col justify-center mb-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl break-words">
                {activeCard.question}
              </h2>
            </div>
          </div>

          {/* Input section & controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <RichTextEditor
                value={userAnswer}
                onChange={setUserAnswer}
                placeholder="Your answer (optional)"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={simulateAIEvaluation}
                disabled={isEvaluating || !userAnswer.replace(/<[^>]*>/g, "").trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 h-12 font-semibold text-primary-foreground hover:opacity-95 transition-all duration-200 active:scale-98 shadow-sm shadow-primary/25 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    AI Evaluating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Evaluate with AI
                  </>
                )}
              </button>
              <button
                onClick={() => setIsFlipped(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 h-12 font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-98 shadow-sm cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Flip
              </button>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div
          ref={backRef}
          className="absolute top-0 left-0 w-full rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm backface-hidden rotate-y-180"
          style={{
            pointerEvents: !isFlipped ? "none" : "auto",
          }}
        >
          <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />

          {/* Card Meta Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="mr-1 p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Back to Dashboard"
                  aria-label="Back to Dashboard"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              Review Flash Card
            </h3>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {activeCard.category}
              </span>
            </div>
          </div>

          {/* Card Body - Back */}
          <div className="min-h-[160px] flex flex-col justify-center mb-6">
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-medium text-foreground text-base sm:text-lg">
                  {activeCard.question}
                </h4>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-foreground leading-relaxed text-sm sm:text-base">
                  {activeCard.answer}
                </p>
              </div>
            </div>
          </div>

          {/* Feedback and Results */}
          <div className="space-y-5">
            {evalResult && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">AI Scoring Report</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-extrabold text-primary font-display">
                      {evalResult.score}
                    </span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {evalResult.feedback}
                </p>

                {/* Metric bar visualizer */}
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500 rounded-full"
                    style={{ width: `${evalResult.score}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-border">
              {/* Self-Scoring Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Again Button */}
                <button
                  onClick={handleNextCard}
                  className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl font-semibold text-xs transition-all duration-200 active:scale-95 cursor-pointer bg-card text-red-600 dark:text-red-400 hover:border-red-500 dark:hover:border-red-400 hover:bg-red-500/20 dark:hover:bg-red-400/5 border border-border shadow-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  Again
                </button>

                {/* Hard Button */}
                <button
                  onClick={handleNextCard}
                  className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl font-semibold text-xs transition-all duration-200 active:scale-95 cursor-pointer bg-card text-amber-600 dark:text-amber-400 hover:border-amber-500 dark:hover:border-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-400/5 border border-border shadow-sm"
                >
                  <Meh className="h-4 w-4" />
                  Hard
                </button>

                {/* Good Button */}
                <button
                  onClick={handleNextCard}
                  className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl font-semibold text-xs transition-all duration-200 active:scale-95 cursor-pointer bg-card text-blue-600 dark:text-blue-400 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-400/5 border border-border shadow-sm"
                >
                  <Smile className="h-4 w-4" />
                  Good
                </button>

                {/* Easy Button */}
                <button
                  onClick={handleNextCard}
                  className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl font-semibold text-xs transition-all duration-200 active:scale-95 cursor-pointer bg-card text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-500/20 dark:hover:bg-emerald-400/5 border border-border shadow-sm"
                >
                  <Zap className="h-4 w-4" />
                  Easy
                </button>
              </div>

              {/* Flip Button to see front again */}
              <div className="flex justify-center">
                <button
                  onClick={() => setIsFlipped(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 h-12 font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 active:scale-98 shadow-sm cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  Flip
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
