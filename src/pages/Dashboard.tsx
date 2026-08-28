import { useState, useEffect } from "react"
import {
  Play,
  CheckCircle2,
  TrendingUp,
  Award,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  HelpCircle,
  Flame,
  AlertTriangle,
  Trophy,
  Hourglass,
  Dumbbell,
  Maximize2,
  Zap
} from "lucide-react"
import type { MasteryLevel, ReviewHistoryRecord } from "../components/Flashcard/Flashcard"
import type { Deck } from "../components/Deck/Deck"
import { getAllReviewHistory } from "../lib/historyStorage"
import { getDashboardStats } from "../lib/statistics"
import { FullscreenGraphModal } from "../components/modals/FullscreenGraphModal"
import { ReviewsGraph, MasteryGraph, SpeedGrowthGraph, STATUS_METADATA } from "../components/Graphs"

interface DashboardPageProps {
  decks: Deck[]
  totalDue: number
  onStartReview: () => void
  onBrowseDecks?: () => void
}


export function Dashboard({
  decks,
  totalDue,
  onStartReview
}: DashboardPageProps) {
  const [history, setHistory] = useState<ReviewHistoryRecord[]>([])

  useEffect(() => {
    getAllReviewHistory()
      .then((records) => {
        setHistory(records)
      })
      .catch((err) => {
        console.error("Failed to load review history:", err)
      })
  }, [])

  const stats = getDashboardStats(history, decks)

  // Get latest mastery counts for current status display
  const latestHistory = stats.graphs.mastery.days[stats.graphs.mastery.days.length - 1] as Record<string, any>

  // Mastery line visibility toggle state
  const [visibleStatus, setVisibleStatus] = useState<Record<MasteryLevel, boolean>>({
    weakness: true,
    slipUp: true,
    learning: true,
    proficient: true,
    mastered: true
  })

  // Selected interval state for reviews history ("days" | "weeks" | "months")
  const [selectedReviewsInterval, setSelectedReviewsInterval] = useState<"days" | "weeks" | "months">("days")

  // Selected interval state for mastery progression history ("days" | "weeks" | "months")
  const [selectedMasteryInterval, setSelectedMasteryInterval] = useState<"days" | "weeks" | "months">("days")

  // Selected interval state for speed growth history ("days" | "weeks" | "months")
  const [selectedSpeedGrowthInterval, setSelectedSpeedGrowthInterval] = useState<"days" | "weeks" | "months">("days")

  // Fullscreen modal state for graphs
  const [activeFullscreenGraph, setActiveFullscreenGraph] = useState<"reviews" | "mastery" | "speedGrowth" | null>(null)

  const toggleStatusVisibility = (statusKey: MasteryLevel) => {
    setVisibleStatus(prev => ({
      ...prev,
      [statusKey]: !prev[statusKey]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-8 md:p-10 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Glow background effects */}
        <div className="absolute top-0 right-0 h-28 w-28 sm:h-48 md:h-64 sm:w-48 md:w-64 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 sm:-left-20 sm:-bottom-20 h-28 w-28 sm:h-48 md:h-64 sm:w-48 md:w-64 bg-primary/5 rounded-full blur-2xl sm:blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8 relative z-10">
          {/* Due counter badge (Shown on top on mobile, on right on desktop) */}
          <div className="flex items-center justify-center shrink-0 self-center md:self-auto md:order-last">
            <div className="relative flex flex-col items-center justify-center w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full border border-border bg-secondary/20 backdrop-blur-xs shadow-inner">
              {/* Pulsing ring if cards are due */}
              {totalDue > 0 && (
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-75" />
              )}
              <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display bg-gradient-to-tr from-primary to-violet-500 bg-clip-text text-transparent leading-none">
                {totalDue}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground mt-1 sm:mt-2 uppercase tracking-widest">
                Due Today
              </span>
            </div>
          </div>

          {/* Heading & Actions */}
          <div className="space-y-3 sm:space-y-4 max-w-lg text-center md:text-left flex flex-col items-center md:items-start">
            <h2 className="font-display font-extrabold text-xl sm:text-2xl md:text-4xl leading-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              {totalDue > 0 ? "Ready for your daily review?" : "You are all caught up!"}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed max-w-md md:max-w-none">
              {totalDue > 0
                ? `You have ${totalDue} card${totalDue > 1 ? "s" : ""} waiting for you. Consistent daily practice is the key to locking information into long-term memory.`
                : "Excellent work! You have no cards due for review today. Keep the momentum going by exploring your decks or creating new flashcards."}
            </p>
            <div className="w-full sm:w-auto pt-1 sm:pt-2">
              <button
                onClick={onStartReview}
                disabled={totalDue === 0}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 px-6 py-3 sm:py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-95 hover:scale-[1.02] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer group ${totalDue > 0 ? "animate-glow-pulse" : "shadow-md shadow-primary/25"
                  }`}
              >
                <Play className="h-4.5 w-4.5 fill-current group-hover:scale-110 transition-transform duration-200" />
                <span>Start Reviewing</span>
                <ChevronRight className="h-4 w-4 stroke-[2.5] ml-0.5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Breakdown Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Streak</span>
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              {stats.streak === 0 ? (
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              ) : (
                <Flame className="h-5 w-5 text-orange-500 shrink-0" />
              )}
              <span className="text-2xl font-bold text-foreground font-display">{stats.streak} Days</span>
            </div>
            <span className="block text-[10px] text-muted-foreground mt-0.5">Top streak: {stats.maxStreak} days</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Reviews Done</span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary shrink-0" />
              <span className="text-2xl font-bold text-foreground font-display">{stats.reviewsDoneTotal}</span>
            </div>
            <span className="block text-[10px] text-muted-foreground mt-0.5">Last 7 days: +{stats.reviewsDoneLast7Days} reviews</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Mastery Rate</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-500 shrink-0" />
              <span className="text-2xl font-bold text-foreground font-display">{stats.masteryRateMastered} / {stats.masteryRateTotal}</span>
            </div>
            <span className="block text-[10px] text-muted-foreground mt-0.5">
              {stats.masteryRateTotal > 0 ? Math.round((stats.masteryRateMastered / stats.masteryRateTotal) * 100) : 0}% of your catalog mastered
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Time Studied</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Hourglass className="h-5 w-5 text-blue-500 shrink-0" />
              <span className="text-2xl font-bold text-foreground font-display">{stats.timeStudiedMins} mins</span>
            </div>
            <span className="block text-[10px] text-muted-foreground mt-0.5">Avg: {stats.timeStudiedAvgMins} mins per study day</span>
          </div>
        </div>
      </div>

      {/* Spaced Repetition Mastery Levels */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-base text-foreground font-display">Mastery Levels</h3>
          <div className="relative group leading-none">
            <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 hidden group-hover:block bg-popover border border-border text-popover-foreground text-xs p-3 rounded-xl shadow-lg z-30 pointer-events-none w-72 leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-200">
              The mastery level of your flashcards is calculated dynamically by spaced repetition logic based on consistency, intervals, and memory grade score achievements.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 pt-2 justify-items-center">
          {STATUS_METADATA.map((status) => (
            <div
              key={status.key}
              className="relative group flex flex-col items-center justify-center transition-all duration-200"
            >
              {/* Circle with card count inside */}
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 flex flex-col items-center justify-center shadow-xs transition-all duration-300 ${status.bgColor} ${status.borderColor} group-hover:scale-105 group-hover:shadow-md`}
              >
                <span className="text-3xl sm:text-4xl font-extrabold font-display text-foreground leading-none">
                  {latestHistory[status.key] ?? 0}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground mt-1.5 uppercase tracking-wider">
                  cards
                </span>
              </div>

              {/* Badge underneath the circle */}
              <div className="mt-3">
                <span
                  className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{
                    color: status.color,
                    backgroundColor: `${status.color}15`,
                    border: `1px solid ${status.color}33`
                  }}
                >
                  {status.label}
                </span>
              </div>

              {/* Tooltip for Success Level */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 hidden group-hover:block bg-popover border border-border text-popover-foreground text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-lg z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" style={{ color: status.color }} />
                  <span>
                    Success Level:{" "}
                    <span className="font-bold" style={{ color: status.color }}>
                      {status.key === "weakness"
                        ? "< 50% success"
                        : status.key === "slipUp"
                          ? "forgotten master"
                          : status.key === "learning"
                            ? "new card"
                            : status.key === "proficient"
                              ? "> 3 correct"
                              : "mature history"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Reviews Completed */}
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground font-display">Reviews Done</h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Interval selector */}
              <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5 shrink-0">
                {(["days", "weeks", "months"] as const).map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setSelectedReviewsInterval(interval)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 capitalize cursor-pointer ${selectedReviewsInterval === interval
                      ? "bg-card text-foreground shadow-xs border border-border/10 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {interval}
                  </button>
                ))}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={() => setActiveFullscreenGraph("reviews")}
                className="p-1.5 rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 cursor-pointer"
                title="View in Fullscreen"
                aria-label="View Reviews Done graph in fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="h-[290px] w-full pt-1">
            <ReviewsGraph
              data={stats.graphs.reviews[selectedReviewsInterval]}
              interval={selectedReviewsInterval}
              enableInteractions={true}
              showInteractionControls={false}
            />
          </div>
        </div>

        {/* Chart 2: Card Mastery Over Time */}
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground font-display">Mastery Progression</h3>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {/* Interval selector */}
              <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5 shrink-0">
                {(["days", "weeks", "months"] as const).map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setSelectedMasteryInterval(interval)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 capitalize cursor-pointer ${selectedMasteryInterval === interval
                      ? "bg-card text-foreground shadow-xs border border-border/10 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {interval}
                  </button>
                ))}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={() => setActiveFullscreenGraph("mastery")}
                className="p-1.5 rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 cursor-pointer"
                title="View in Fullscreen"
                aria-label="View Mastery Progression graph in fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-[300px] w-full pt-1 flex-1">
            <MasteryGraph
              data={stats.graphs.mastery[selectedMasteryInterval]}
              visibleStatus={visibleStatus}
              onToggleStatus={toggleStatusVisibility}
              interval={selectedMasteryInterval}
              enableInteractions={true}
              showInteractionControls={false}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Speed Growth Analytics */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground font-display">Speed Growth</h3>
                <div className="relative group leading-none">
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 hidden group-hover:block bg-popover border border-border text-popover-foreground text-xs p-3 rounded-xl shadow-lg z-30 pointer-events-none w-72 leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-200">
                    Calculates how your review speed grows across history relative to the previous review of each card, averaged across all reviews on a given day, week, or month.
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Acceleration in recall speed across review sessions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Interval selector */}
            <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5 shrink-0">
              {(["days", "weeks", "months"] as const).map((interval) => (
                <button
                  key={interval}
                  onClick={() => setSelectedSpeedGrowthInterval(interval)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 capitalize cursor-pointer ${
                    selectedSpeedGrowthInterval === interval
                      ? "bg-card text-foreground shadow-xs border border-border/10 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {interval}
                </button>
              ))}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={() => setActiveFullscreenGraph("speedGrowth")}
              className="p-1.5 rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 cursor-pointer"
              title="View in Fullscreen"
              aria-label="View Speed Growth graph in fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Speed Summary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Avg Speed Growth</span>
            <span
              className={`text-sm font-bold font-display ${
                stats.avgSpeedGrowth > 0
                  ? "text-emerald-500"
                  : stats.avgSpeedGrowth < 0
                    ? "text-rose-500"
                    : "text-foreground"
              }`}
            >
              {stats.avgSpeedGrowth > 0 ? `+${stats.avgSpeedGrowth}%` : `${stats.avgSpeedGrowth}%`}
            </span>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Avg Response Time</span>
            <span className="text-sm font-bold text-foreground font-display">
              {stats.avgReviewDuration > 0 ? `${stats.avgReviewDuration}s` : "—"}
            </span>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Recall Velocity</span>
            <span className="text-sm font-bold text-cyan-500 font-display">
              {stats.avgReviewDuration > 0
                ? `${Math.round((60 / stats.avgReviewDuration) * 10) / 10} cards/min`
                : "—"}
            </span>
          </div>
        </div>

        <div className="h-[290px] w-full pt-1">
          <SpeedGrowthGraph
            data={stats.graphs.speedGrowth[selectedSpeedGrowthInterval]}
            interval={selectedSpeedGrowthInterval}
            enableInteractions={true}
            showInteractionControls={false}
          />
        </div>
      </div>

      {/* Fullscreen Graph Modal */}
      <FullscreenGraphModal
        isOpen={activeFullscreenGraph !== null}
        onClose={() => setActiveFullscreenGraph(null)}
        title={
          activeFullscreenGraph === "reviews"
            ? "Reviews Done"
            : activeFullscreenGraph === "mastery"
              ? "Mastery Progression"
              : activeFullscreenGraph === "speedGrowth"
                ? "Review Speed Growth"
                : ""
        }
        icon={
          activeFullscreenGraph === "reviews" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : activeFullscreenGraph === "mastery" ? (
            <Layers className="h-5 w-5" />
          ) : (
            <Zap className="h-5 w-5 text-cyan-500" />
          )
        }
        actions={
          activeFullscreenGraph === "reviews" ? (
            <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5 shrink-0">
              {(["days", "weeks", "months"] as const).map((interval) => (
                <button
                  key={interval}
                  onClick={() => setSelectedReviewsInterval(interval)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 capitalize cursor-pointer ${selectedReviewsInterval === interval
                    ? "bg-card text-foreground shadow-xs border border-border/10 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {interval}
                </button>
              ))}
            </div>
          ) : activeFullscreenGraph === "mastery" ? (
            <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5 shrink-0">
              {(["days", "weeks", "months"] as const).map((interval) => (
                <button
                  key={interval}
                  onClick={() => setSelectedMasteryInterval(interval)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 capitalize cursor-pointer ${selectedMasteryInterval === interval
                    ? "bg-card text-foreground shadow-xs border border-border/10 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {interval}
                </button>
              ))}
            </div>
          ) : activeFullscreenGraph === "speedGrowth" ? (
            <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5 shrink-0">
              {(["days", "weeks", "months"] as const).map((interval) => (
                <button
                  key={interval}
                  onClick={() => setSelectedSpeedGrowthInterval(interval)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 capitalize cursor-pointer ${selectedSpeedGrowthInterval === interval
                    ? "bg-card text-foreground shadow-xs border border-border/10 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {interval}
                </button>
              ))}
            </div>
          ) : null
        }
      >
        {activeFullscreenGraph === "reviews" && (
          <ReviewsGraph
            data={stats.graphs.reviews[selectedReviewsInterval]}
            interval={selectedReviewsInterval}
            isFullscreen
          />
        )}
        {activeFullscreenGraph === "mastery" && (
          <MasteryGraph
            data={stats.graphs.mastery[selectedMasteryInterval]}
            visibleStatus={visibleStatus}
            onToggleStatus={toggleStatusVisibility}
            isFullscreen
          />
        )}
        {activeFullscreenGraph === "speedGrowth" && (
          <SpeedGrowthGraph
            data={stats.graphs.speedGrowth[selectedSpeedGrowthInterval]}
            interval={selectedSpeedGrowthInterval}
            isFullscreen
          />
        )}
      </FullscreenGraphModal>
    </div>
  )
}

