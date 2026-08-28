import { useState, useEffect, useMemo } from "react"
import {
  X,
  Clock,
  Zap,
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity
} from "lucide-react"
import type { Flashcard, ReviewHistoryRecord } from "./Flashcard"
import { getReviewsForCard } from "../../lib/historyStorage"
import { CardReviewSpeedGraph } from "../Graphs/CardReviewSpeedGraph"

export interface CardReviewHistoryProps {
  card: Flashcard | null
  isOpen: boolean
  onClose: () => void
  deckTitle?: string
}

export function CardReviewHistory({
  card,
  isOpen,
  onClose,
  deckTitle
}: CardReviewHistoryProps) {
  const [history, setHistory] = useState<ReviewHistoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen || !card) {
      setHistory([])
      return
    }

    let isMounted = true
    setIsLoading(true)

    getReviewsForCard(card.id)
      .then((records) => {
        if (isMounted) {
          setHistory(records)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        console.error("Failed to load review history for card:", err)
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, card?.id])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const stats = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        totalReviews: 0,
        avgDuration: 0,
        fastestDuration: 0,
        retentionRate: 0,
        againCount: 0,
        goodCount: 0,
        easyCount: 0,
        hardCount: 0
      }
    }

    const total = history.length
    const withDuration = history.filter((h) => (h.reviewDuration ?? 0) > 0)
    const avgDur = withDuration.length > 0
      ? withDuration.reduce((acc, curr) => acc + (curr.reviewDuration ?? 0), 0) / withDuration.length
      : 0

    const durations = withDuration.map((h) => h.reviewDuration ?? 0)
    const fastestDur = durations.length > 0 ? Math.min(...durations) : 0

    const successful = history.filter((h) => h.rating !== "again").length
    const retentionRate = Math.round((successful / total) * 100)

    const againCount = history.filter((h) => h.rating === "again").length
    const hardCount = history.filter((h) => h.rating === "hard").length
    const goodCount = history.filter((h) => h.rating === "good").length
    const easyCount = history.filter((h) => h.rating === "easy").length

    return {
      totalReviews: total,
      avgDuration: Number(avgDur.toFixed(1)),
      fastestDuration: Number(fastestDur.toFixed(1)),
      retentionRate,
      againCount,
      hardCount,
      goodCount,
      easyCount
    }
  }, [history])

  if (!isOpen || !card) return null

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "easy":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Easy
          </span>
        )
      case "good":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
            Good
          </span>
        )
      case "hard":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Hard
          </span>
        )
      case "again":
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            Again
          </span>
        )
    }
  }

  const getMasteryColor = (level?: string) => {
    switch (level) {
      case "mastered":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "proficient":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
      case "learning":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "slipUp":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "weakness":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20"
      default:
        return "bg-secondary text-muted-foreground border-border/40"
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200 cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        className="relative z-10 w-full max-w-3xl max-h-[90vh] rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-history-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 p-6 sm:p-7 border-b border-border/60 bg-secondary/15 shrink-0">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h2 id="card-history-modal-title" className="font-display text-lg sm:text-xl font-bold text-foreground truncate">
                Card Review History
              </h2>
              {deckTitle && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium border border-border/40 truncate max-w-[200px]">
                  {deckTitle}
                </span>
              )}
              {card.masteryLevel && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getMasteryColor(card.masteryLevel)}`}>
                  {card.masteryLevel}
                </span>
              )}
            </div>

            {/* Card Question Snippet */}
            <div className="bg-background/80 border border-border/50 rounded-xl px-3.5 py-2 mt-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">
                Question
              </span>
              <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-2">
                {card.question}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0 mt-0.5"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-muted-foreground">Loading card review history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-3xl bg-secondary/10 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <Clock className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="font-display text-sm font-bold text-foreground">No Review History Yet</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This card has not been reviewed in practice sessions yet. Start a review session to record recall speed, retention, and spaced repetition analytics.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Activity className="h-3.5 w-3.5 text-primary" />
                    <span>Total Reviews</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-display text-foreground">
                    {stats.totalReviews}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex gap-1 items-center">
                    <span>Pass rate:</span>
                    <span className="font-semibold text-foreground">{stats.retentionRate}%</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-cyan-500" />
                    <span>Avg Speed</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-display text-cyan-500">
                    {stats.avgDuration > 0 ? `${stats.avgDuration}s` : "--"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {stats.avgDuration > 0
                      ? `${(60 / stats.avgDuration).toFixed(1)} cards/min`
                      : "per review"}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>Fastest Recall</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-display text-amber-500">
                    {stats.fastestDuration > 0 ? `${stats.fastestDuration}s` : "--"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Best response time
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Award className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Current Interval</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-display text-foreground">
                    {(card.interval || 0) >= 24
                      ? `${Math.round((card.interval || 0) / 24)}d`
                      : `${card.interval || 0}h`}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Ease: {(card.easeFactor || 2.5).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Review Speed Graph Component */}
              <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/15 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cyan-500" />
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                      Recall Speed Trend (Seconds per Review)
                    </h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {history.length} {history.length === 1 ? "attempt" : "attempts"}
                  </span>
                </div>

                <CardReviewSpeedGraph history={history} height={210} />
              </div>

              {/* Detailed Review Log Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Review Session Logs ({history.length})
                  </h3>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card overflow-hidden divide-y divide-border/50 shadow-xs">
                  {history
                    .slice()
                    .reverse()
                    .map((rec, revIdx) => {
                      const attemptNum = history.length - revIdx
                      const isExpanded = expandedRow === attemptNum
                      const date = new Date(rec.timestamp)
                      const formattedDate = !isNaN(date.getTime())
                        ? date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : rec.timestamp

                      const duration = rec.reviewDuration ?? 0
                      const hasDetails = Boolean(rec.userAnswer || rec.aiEvaluation)

                      return (
                        <div key={`${rec.cardId}-${rec.timestamp}-${attemptNum}`} className="p-3.5 sm:p-4 hover:bg-secondary/20 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            {/* Attempt & Date */}
                            <div className="flex items-center gap-3">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-foreground text-xs font-bold font-display shrink-0 border border-border/40">
                                #{attemptNum}
                              </span>
                              <div>
                                <div className="text-xs font-semibold text-foreground">
                                  {formattedDate}
                                </div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                  <span>Interval: {rec.interval >= 24 ? `${Math.round(rec.interval / 24)}d` : `${rec.interval}h`}</span>
                                  <span>•</span>
                                  <span>Ease: {rec.easeFactor.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Speed & Rating Badges */}
                            <div className="flex items-center gap-2 sm:gap-3">
                              {duration > 0 && (
                                <div className="flex items-center gap-1 text-xs font-bold font-display px-2.5 py-1 rounded-lg bg-secondary/80 text-foreground border border-border/40">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span>{duration.toFixed(1)}s</span>
                                </div>
                              )}

                              {getRatingBadge(rec.rating)}

                              {hasDetails && (
                                <button
                                  onClick={() => setExpandedRow(isExpanded ? null : attemptNum)}
                                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
                                  title="Toggle Review Details"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expandable Review Details (User Answer & AI Eval) */}
                          {isExpanded && hasDetails && (
                            <div className="mt-3 pt-3 border-t border-border/40 space-y-2 text-xs animate-in fade-in duration-150">
                              {rec.userAnswer && (
                                <div className="bg-secondary/30 p-2.5 rounded-xl border border-border/40 space-y-0.5">
                                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                    Your Submitted Answer:
                                  </span>
                                  <p className="text-foreground italic">"{rec.userAnswer}"</p>
                                </div>
                              )}

                              {rec.aiEvaluation && (
                                <div className="bg-primary/5 p-2.5 rounded-xl border border-primary/20 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-wider">
                                      <Sparkles className="h-3 w-3" />
                                      AI Evaluation:
                                    </span>
                                    {rec.aiEvaluation.score !== undefined && (
                                      <span className="text-[11px] font-bold text-primary">
                                        Score: {rec.aiEvaluation.score}%
                                      </span>
                                    )}
                                  </div>
                                  {rec.aiEvaluation.feedback && (
                                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                                      {rec.aiEvaluation.feedback}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border/60 bg-secondary/15 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-secondary border border-border text-xs font-semibold text-foreground hover:bg-secondary/80 transition-all cursor-pointer active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
