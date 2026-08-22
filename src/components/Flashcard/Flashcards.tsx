import { useState, useRef, useEffect } from "react"
import {
  RefreshCw,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Meh,
  Smile,
  Zap,
  ArrowLeft,
  HelpCircle,
  Settings
} from "lucide-react"
import { RichTextEditor } from "../RichTextEditor/RichTextEditor"
import type { Flashcard } from "./Flashcard"
import type { SettingsState } from "../Settings"
import { getModelInstance } from "../../lib/ai"
import { evaluateAnswer, type EvalResult } from "../../lib/aiEvaluation"
import { ModelSelectorModal } from "../ModelSelectorModal"
import { PinDecryptModal } from "../PinDecryptModal"

export const SAMPLE_CARDS: Flashcard[] = [
  {
    id: "1",
    deckId: "deck-1",
    label: "System Architecture",
    question: "What is Spaced Repetition?",
    answer: "A learning technique where flashcards are scheduled for review at increasing intervals based on how well you remember them. It exploits the psychological spacing effect to maximize retention.",
    hints: [
      "<p>It is based on the <strong>forgetting curve</strong>.</p>",
      "<p>Think about spacing out reviews over time rather than cramming.</p>"
    ]
  },
  {
    id: "2",
    deckId: "deck-2",
    label: "Progressive Web Apps",
    question: "Explain Offline-First Architecture",
    answer: "A design pattern where all data read/write operations are performed against a local database (like IndexedDB) first. Background synchronization handles syncing with server endpoints when online, ensuring the app works without internet.",
    hints: [
      "<p>Data is stored locally first before syncing.</p>"
    ]
  },
  {
    id: "3",
    deckId: "deck-3",
    label: "AI & LLMs",
    question: "How can LLMs be used to enhance flashcards?",
    answer: "Traditional cards rely on binary self-grading. AI evaluation analyzes free-form or spoken answers for accuracy, semantic correctness, and completeness, providing detailed corrective feedback.",
    hints: [
      "<p>AI acts as an intelligent grader.</p>"
    ]
  }
]

export interface FlashcardReviewProps {
  cards: Flashcard[]
  settings: SettingsState
  onUpdateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  decryptedKeys: Record<string, string>
  setDecryptedKeys: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onReviewCard: (
    cardId: string,
    rating: "again" | "hard" | "good" | "easy",
    reviewDuration: number,
    aiEvaluation?: EvalResult,
    userAnswer?: string
  ) => void
  onClose: () => void
}

export function FlashcardReview({
  cards = [],
  settings,
  decryptedKeys,
  setDecryptedKeys,
  onReviewCard,
  onClose
}: FlashcardReviewProps) {
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [userAnswer, setUserAnswer] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evalProgress, setEvalProgress] = useState(0)

  useEffect(() => {
    let intervalId: any
    if (isEvaluating) {
      setEvalProgress(0)
      intervalId = setInterval(() => {
        setEvalProgress((prev) => {
          const remaining = 100 - prev
          const step = remaining * 0.08
          return Math.min(prev + step, 99.9)
        })
      }, 100)
    } else {
      setEvalProgress(0)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isEvaluating])

  const [evalResult, setEvalResult] = useState<EvalResult | null>(null)
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({})


  // Modals state
  let [aiEvaluationProvider, setAiEvaluationProvider] = useState(() => localStorage.getItem("ai_evaluation_provider") || "")
  let [aiEvaluationModel, setAiEvaluationModel] = useState(() => localStorage.getItem("ai_evaluation_model") || "")

  const rawOverrideProvider = aiEvaluationProvider
  const rawOverrideModel = aiEvaluationModel

  aiEvaluationProvider ||= settings.aiModelProvider
  aiEvaluationModel ||= settings.aiModelName

  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [pinModalProvider, setPinModalProvider] = useState("")

  // Stats for completion screen
  const [stats, setStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    totalReviews: 0
  })

  const elapsedTimeRef = useRef<number>(0)
  const lastActiveTimeRef = useRef<number>(Date.now())
  const isTimerRunningRef = useRef<boolean>(true)

  const pauseTimer = () => {
    if (isTimerRunningRef.current) {
      elapsedTimeRef.current += Date.now() - lastActiveTimeRef.current
      isTimerRunningRef.current = false
    }
  }

  const resumeTimer = () => {
    if (!isTimerRunningRef.current && document.visibilityState === "visible") {
      lastActiveTimeRef.current = Date.now()
      isTimerRunningRef.current = true
    }
  }

  const getDurationSec = (): number => {
    let totalMs = elapsedTimeRef.current
    if (isTimerRunningRef.current) {
      totalMs += Date.now() - lastActiveTimeRef.current
    }
    return parseFloat((totalMs / 1000).toFixed(3))
  }

  // Reset revealed hints and timer when card changes
  useEffect(() => {
    setRevealedHints({})
    elapsedTimeRef.current = 0
    lastActiveTimeRef.current = Date.now()
    isTimerRunningRef.current = document.visibilityState === "visible"
  }, [activeCardIndex])

  // Manage pause/resume on page visibility, focus, and blur events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!isEvaluating) {
          resumeTimer()
        }
      } else {
        pauseTimer()
      }
    }

    const handleFocus = () => {
      if (!isEvaluating) {
        resumeTimer()
      }
    }

    const handleBlur = () => {
      pauseTimer()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)
    window.addEventListener("blur", handleBlur)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("blur", handleBlur)
    }
  }, [isEvaluating])

  // Pause timer during AI evaluation
  useEffect(() => {
    if (isEvaluating) {
      pauseTimer()
    } else {
      resumeTimer()
    }
  }, [isEvaluating])

  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeCardIndex >= cards.length) return
    const activeElement = isFlipped ? backRef.current : frontRef.current
    if (!activeElement) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setCardHeight(entry.target.getBoundingClientRect().height)
      }
    })

    resizeObserver.observe(activeElement)
    return () => resizeObserver.disconnect()
  }, [isFlipped, userAnswer, evalResult, activeCardIndex, cards.length])

  if (cards.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm text-center space-y-4 max-w-md mx-auto">
        <CheckCircle22 className="h-12 w-12 text-emerald-500 mx-auto" />
        <h2 className="font-display text-xl font-bold text-foreground">All caught up!</h2>
        <p className="text-sm text-muted-foreground">There are no due flashcards to review right now.</p>
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:opacity-95 transition-all cursor-pointer"
        >
          Go Back
        </button>
      </div>
    )
  }

  function CheckCircle22(props: any) {
    return <CheckCircle2 {...props} />
  }

  if (activeCardIndex >= cards.length) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm text-center space-y-6 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-foreground">Review Session Complete! 🎉</h2>
          <p className="text-sm text-muted-foreground">You have finished reviewing all cards in this session.</p>
        </div>
        <div className="grid grid-cols-4 gap-2 bg-secondary/30 p-4 rounded-2xl border border-border/40">
          <div className="text-center">
            <span className="block text-lg font-bold text-red-500">{stats.again}</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Again</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-bold text-amber-500">{stats.hard}</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Hard</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-bold text-blue-500">{stats.good}</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Good</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-bold text-emerald-500">{stats.easy}</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Easy</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Total cards studied: <span className="font-semibold text-foreground">{stats.totalReviews}</span>
        </div>
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-95 transition-all cursor-pointer shadow-sm shadow-primary/25"
        >
          Finish & Return to Dashboard
        </button>
      </div>
    )
  }

  const activeCard = cards[activeCardIndex]

  const handleScore = (rating: "again" | "hard" | "good" | "easy") => {
    setStats((prev) => ({
      ...prev,
      [rating]: prev[rating] + 1,
      totalReviews: prev.totalReviews + 1
    }))
    const durationSec = getDurationSec()
    onReviewCard(
      activeCard.id,
      rating,
      durationSec,
      evalResult || undefined,
      evalResult ? userAnswer.replace(/<[^>]*>/g, "").trim() : undefined
    )
    setIsFlipped(false)
    setEvalResult(null)
    setUserAnswer("")
    setActiveCardIndex((prev) => prev + 1)
  }

  const runRealAIEvaluation = async (apiKey: string) => {
    setIsEvaluating(true)
    try {
      const promptTemplate = settings.aiEvalPrompt

      const model = getModelInstance(aiEvaluationProvider, aiEvaluationModel, apiKey)
      const result = await evaluateAnswer(
        activeCard.question,
        activeCard.answer,
        userAnswer.replace(/<[^>]*>/g, "").trim(),
        promptTemplate,
        model,
        aiEvaluationProvider,
        aiEvaluationModel
      )

      setEvalResult(result)
      setIsFlipped(true)
      setIsPinModalOpen(false)
    } catch (err: any) {
      console.error("AI Evaluation failed:", err)
      alert(`AI Evaluation failed: ${err.message || err}`)
    } finally {
      setIsEvaluating(false)
    }
  }

  const triggerAIEvaluation = async () => {
    const cleanUserAnswer = userAnswer.replace(/<[^>]*>/g, "").trim()
    if (!cleanUserAnswer) return

    const provider = aiEvaluationProvider

    // Check if we have the key decrypted in memory
    const existingKey = decryptedKeys[provider.toLowerCase()]
    if (existingKey) {
      await runRealAIEvaluation(existingKey)
    } else {
      setPinModalProvider(provider)
      setIsPinModalOpen(true)
    }
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
            pointerEvents: isFlipped ? "none" : "auto"
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
              {/* Settings button to open model selector */}
              <button
                type="button"
                onClick={() => setIsModelSelectorOpen(true)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={`AI Model: ${aiEvaluationProvider} - ${aiEvaluationModel}`}
              >
                <Settings className="h-4.5 w-4.5" />
              </button>
              <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {activeCard.label}
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

          {/* Hints Section */}
          {activeCard.hints && activeCard.hints.length > 0 && (
            <div className="mb-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2 justify-center">
                {activeCard.hints.map((_, idx) => {
                  const isRevealed = !!revealedHints[idx]
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRevealedHints((prev) => ({ ...prev, [idx]: !isRevealed }))}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${isRevealed
                        ? "bg-secondary text-secondary-foreground border-secondary"
                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      {isRevealed ? `Hide Hint ${idx + 1}` : `Show Hint ${idx + 1}`}
                    </button>
                  )
                })}
              </div>

              {/* Render revealed hints */}
              <div className="space-y-2 max-w-xl mx-auto">
                {activeCard.hints.map((hint, idx) => {
                  if (!revealedHints[idx]) return null
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl border border-amber-500/10 bg-amber-500/5 text-xs text-foreground leading-relaxed animate-in fade-in-50 slide-in-from-top-1 duration-200"
                    >
                      <div className="font-bold text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                        Hint #{idx + 1}
                      </div>
                      <div
                        className="prose dark:prose-invert max-w-none text-muted-foreground leading-normal"
                        dangerouslySetInnerHTML={{ __html: hint }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Input section & controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <RichTextEditor value={userAnswer} onChange={setUserAnswer} placeholder="Your answer (optional)" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={triggerAIEvaluation}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 h-12 font-semibold text-primary-foreground hover:opacity-95 transition-all duration-200 active:scale-98 shadow-sm shadow-primary/25 relative overflow-hidden ${isEvaluating
                  ? "pointer-events-none opacity-100 animate-gradient-shimmer"
                  : !userAnswer.replace(/<[^>]*>/g, "").trim()
                    ? "bg-primary opacity-40 pointer-events-none"
                    : "bg-primary cursor-pointer"
                  }`}
              >
                {isEvaluating && (
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-violet-200/10 to-violet-200/65 transition-all duration-100 ease-out pointer-events-none overflow-hidden"
                    style={{ width: `${evalProgress}%` }}
                  >
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 w-full h-full shimmer-bar animate-shimmer-sweep" />
                    <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-violet-200 shadow-[0_0_8px_#e9d5ff]" />
                  </div>
                )}
                <span className="relative z-10 flex items-center gap-2">
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
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsModelSelectorOpen(true)}
                className="flex items-center justify-center rounded-xl border border-border px-3.5 h-12 text-muted-foreground hover:text-foreground hover:bg-accent hover:border-accent-foreground/30 transition-all duration-200 cursor-pointer shrink-0"
                title={`Configure AI Model for Evaluation (Current: ${aiEvaluationProvider} - ${aiEvaluationModel})`}
              >
                <Settings className="h-5 w-5" />
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
            pointerEvents: !isFlipped ? "none" : "auto"
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
              {/* Settings button to open model selector */}
              <button
                type="button"
                onClick={() => setIsModelSelectorOpen(true)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={`AI Model: ${aiEvaluationProvider} - ${aiEvaluationModel}`}
              >
                <Settings className="h-4.5 w-4.5" />
              </button>
              <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {activeCard.label}
              </span>
            </div>
          </div>

          {/* Card Body - Back */}
          <div className="min-h-[160px] flex flex-col justify-center mb-6">
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-medium text-foreground text-base sm:text-lg">{activeCard.question}</h4>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-foreground leading-relaxed text-sm sm:text-base">{activeCard.answer}</p>
              </div>
            </div>
          </div>

          {/* Feedback and Results */}
          <div className="space-y-5">
            {evalResult && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                    <span className="font-semibold text-foreground text-sm">AI Evaluation Report</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${evalResult.rating === "easy"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : evalResult.rating === "good"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : evalResult.rating === "hard"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        }`}
                    >
                      AI: {evalResult.rating}
                    </span>
                    <span className="text-2xl font-extrabold text-primary font-display flex items-baseline">
                      {evalResult.score}
                      <span className="text-[10px] text-muted-foreground font-normal ml-0.5">/100</span>
                    </span>
                  </div>
                </div>

                {/* Metric bar visualizer */}
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500 rounded-full relative overflow-hidden"
                    style={{ width: `${evalResult.score}%` }}
                  >
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 w-full h-full shimmer-bar animate-shimmer-sweep" />
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground border-b border-border/40 pb-3">
                  {evalResult.feedback}
                </p>

                {/* Correct Parts */}
                {evalResult.correctParts && evalResult.correctParts.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      Correct Concepts
                    </div>
                    <ul className="text-xs space-y-0.5 pl-3 text-muted-foreground list-disc leading-relaxed">
                      {evalResult.correctParts.map((part, idx) => (
                        <li key={idx}>{part}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Parts */}
                {evalResult.missingParts && evalResult.missingParts.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-amber-500" />
                      Missing Details
                    </div>
                    <ul className="text-xs space-y-0.5 pl-3 text-muted-foreground list-disc leading-relaxed">
                      {evalResult.missingParts.map((part, idx) => (
                        <li key={idx}>{part}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Wrong Parts */}
                {evalResult.wrongParts && evalResult.wrongParts.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-rose-500" />
                      Misconceptions / Errors
                    </div>
                    <ul className="text-xs space-y-0.5 pl-3 text-muted-foreground list-disc leading-relaxed">
                      {evalResult.wrongParts.map((part, idx) => (
                        <li key={idx}>{part}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-border">
              {evalResult ? (
                /* AI Rated: Next Card and Flip Buttons side-by-side */
                <div className="flex gap-3">
                  <button
                    onClick={() => handleScore(evalResult.rating)}
                    className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-md shadow-primary/20"
                  >
                    Next Card
                  </button>
                  <button
                    onClick={() => setIsFlipped(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 h-12 font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-98 shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Flip
                  </button>
                </div>
              ) : (
                /* Manual Self-Scoring Buttons */
                <>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {/* Again Button */}
                    <button
                      onClick={() => handleScore("again")}
                      className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl font-semibold text-xs transition-all duration-200 active:scale-95 cursor-pointer bg-card text-red-600 dark:text-red-400 border border-border hover:border-red-500 dark:hover:border-red-400 hover:bg-red-500/20 dark:hover:bg-red-400/5 shadow-sm"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Again
                    </button>

                    {/* Hard Button */}
                    <button
                      onClick={() => handleScore("hard")}
                      className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl font-semibold text-xs transition-all duration-200 active:scale-95 cursor-pointer bg-card text-amber-600 dark:text-amber-400 border border-border hover:border-amber-500 dark:hover:border-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-400/5 shadow-sm"
                    >
                      <Meh className="h-4 w-4" />
                      Hard
                    </button>

                    {/* Good Button */}
                    <button
                      onClick={() => handleScore("good")}
                      className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl font-semibold text-xs transition-all duration-200 active:scale-95 cursor-pointer bg-card text-blue-600 dark:text-blue-400 border border-border hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-400/5 shadow-sm"
                    >
                      <Smile className="h-4 w-4" />
                      Good
                    </button>

                    {/* Easy Button */}
                    <button
                      onClick={() => handleScore("easy")}
                      className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl font-semibold text-xs transition-all duration-200 active:scale-95 cursor-pointer bg-card text-emerald-600 dark:text-emerald-400 border border-border hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-500/20 dark:hover:bg-emerald-400/5 shadow-sm"
                    >
                      <Zap className="h-4 w-4" />
                      Easy
                    </button>
                  </div>

                  {/* Flip Button to see front again */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => setIsFlipped(false)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 h-12 font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-98 shadow-sm cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Flip
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Model Selector Modal Component */}
      <ModelSelectorModal
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        settings={settings}
        overrideProvider={rawOverrideProvider}
        overrideModel={rawOverrideModel}
        onUpdateOverride={(provider, model) => {
          if (provider === "") {
            localStorage.removeItem("ai_evaluation_provider")
            localStorage.removeItem("ai_evaluation_model")
            setAiEvaluationProvider("")
            setAiEvaluationModel("")
          } else {
            localStorage.setItem("ai_evaluation_provider", provider)
            localStorage.setItem("ai_evaluation_model", model)
            setAiEvaluationProvider(provider)
            setAiEvaluationModel(model)
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
          runRealAIEvaluation(apiKey)
        }}
        setDecryptedKeys={setDecryptedKeys}
      />
    </div>
  )
}
