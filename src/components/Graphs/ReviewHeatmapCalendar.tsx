import { useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, RotateCcw, Flame, CheckCircle2, Clock } from "lucide-react"
import type { ReviewHistoryRecord } from "../Flashcard/Flashcard"

export interface ReviewHeatmapCalendarProps {
  history: ReviewHistoryRecord[]
  range?: "3M" | "6M" | "1Y"
  onRangeChange?: (range: "3M" | "6M" | "1Y") => void
  isFullscreen?: boolean
  showControls?: boolean
  showSummaryBadges?: boolean
  className?: string
}

interface DayActivity {
  date: Date
  dateStr: string // YYYY-MM-DD
  count: number
  durationSec: number
  uniqueCards: number
  isToday: boolean
  isFuture: boolean
}

const getLocalDateStr = (d: Date): string => {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function ReviewHeatmapCalendar({
  history,
  range: externalRange,
  onRangeChange: externalOnRangeChange,
  isFullscreen = false,
  showControls = true,
  showSummaryBadges = true,
  className = ""
}: ReviewHeatmapCalendarProps) {
  const [internalRange, setInternalRange] = useState<"3M" | "6M" | "1Y">(
    isFullscreen ? "1Y" : "3M"
  )
  const range = externalRange || internalRange
  const setRange = (newRange: "3M" | "6M" | "1Y") => {
    if (externalOnRangeChange) {
      externalOnRangeChange(newRange)
    } else {
      setInternalRange(newRange)
    }
  }

  // Week offset for navigation (0 = current period ending today, >0 = offset into the past)
  const [weekOffset, setWeekOffset] = useState(0)
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; placement: "top" | "bottom" } | null>(null)

  // Map history records by date string YYYY-MM-DD
  const dailyHistoryMap = useMemo(() => {
    const map = new Map<string, { count: number; durationSec: number; cardIds: Set<string> }>()
    for (const r of history) {
      const d = new Date(r.timestamp)
      const dateStr = getLocalDateStr(d)
      let entry = map.get(dateStr)
      if (!entry) {
        entry = { count: 0, durationSec: 0, cardIds: new Set<string>() }
        map.set(dateStr, entry)
      }
      entry.count++
      entry.durationSec += r.reviewDuration && r.reviewDuration > 0 ? r.reviewDuration : 5
      entry.cardIds.add(r.cardId)
    }
    return map
  }, [history])

  // Total weeks to show based on range
  const numWeeks = useMemo(() => {
    if (range === "1Y") return isFullscreen ? 52 : 40
    if (range === "6M") return isFullscreen ? 26 : 24
    return isFullscreen ? 16 : 14 // 3M
  }, [range, isFullscreen])

  // Generate calendar grid data (columns of 7 days, Sunday to Saturday)
  const { weeks, monthLabels, stats } = useMemo(() => {
    const today = new Date()
    const todayStr = getLocalDateStr(today)

    // Calculate reference end date adjusted by weekOffset
    const referenceEnd = new Date(today)
    referenceEnd.setDate(referenceEnd.getDate() - weekOffset * 7)

    // Find the Saturday of the reference week (end of column)
    const endOfWeek = new Date(referenceEnd)
    const dayOfWeek = endOfWeek.getDay() // 0 = Sun, 6 = Sat
    endOfWeek.setDate(endOfWeek.getDate() + (6 - dayOfWeek))
    endOfWeek.setHours(23, 59, 59, 999)

    // Start date is `numWeeks` prior Sunday
    const startOfWeek = new Date(endOfWeek)
    startOfWeek.setDate(startOfWeek.getDate() - (numWeeks * 7 - 1))
    startOfWeek.setHours(0, 0, 0, 0)

    const weeksList: DayActivity[][] = []
    const months: { label: string; weekIndex: number }[] = []
    let lastMonth = -1

    let totalReviewsInRange = 0
    let totalDurationInRange = 0
    let activeDaysCount = 0
    let maxReviewsInSingleDay = 0

    let currentCursor = new Date(startOfWeek)

    for (let w = 0; w < numWeeks; w++) {
      const currentWeek: DayActivity[] = []
      for (let d = 0; d < 7; d++) {
        const dateCopy = new Date(currentCursor)
        const dateStr = getLocalDateStr(dateCopy)
        const isToday = dateStr === todayStr
        const isFuture = dateCopy.getTime() > today.getTime()

        const historyEntry = dailyHistoryMap.get(dateStr)
        const count = historyEntry ? historyEntry.count : 0
        const durationSec = historyEntry ? historyEntry.durationSec : 0
        const uniqueCards = historyEntry ? historyEntry.cardIds.size : 0

        if (!isFuture) {
          totalReviewsInRange += count
          totalDurationInRange += durationSec
          if (count > 0) {
            activeDaysCount++
            if (count > maxReviewsInSingleDay) {
              maxReviewsInSingleDay = count
            }
          }
        }

        // Track month label on the first day of each month
        if (dateCopy.getDate() <= 7 && dateCopy.getMonth() !== lastMonth) {
          months.push({
            label: MONTH_NAMES[dateCopy.getMonth()],
            weekIndex: w
          })
          lastMonth = dateCopy.getMonth()
        }

        currentWeek.push({
          date: dateCopy,
          dateStr,
          count,
          durationSec,
          uniqueCards,
          isToday,
          isFuture
        })

        currentCursor.setDate(currentCursor.getDate() + 1)
      }
      weeksList.push(currentWeek)
    }

    const totalDaysInRange = numWeeks * 7
    const consistencyPercent = totalDaysInRange > 0 ? Math.round((activeDaysCount / totalDaysInRange) * 100) : 0
    const avgReviewsPerActiveDay = activeDaysCount > 0 ? Math.round((totalReviewsInRange / activeDaysCount) * 10) / 10 : 0

    return {
      weeks: weeksList,
      monthLabels: months,
      stats: {
        totalReviews: totalReviewsInRange,
        totalDurationMinutes: Math.round(totalDurationInRange / 60),
        activeDays: activeDaysCount,
        totalDays: totalDaysInRange,
        consistencyPercent,
        maxReviewsInSingleDay,
        avgReviewsPerActiveDay
      }
    }
  }, [dailyHistoryMap, numWeeks, weekOffset])

  // Intensity color mapper
  const getCellColorClass = (day: DayActivity) => {
    if (day.isFuture) {
      return "bg-secondary/15 border-transparent cursor-not-allowed opacity-30"
    }
    if (day.count === 0) {
      return "bg-secondary/40 border-border/40 hover:border-border/80 hover:bg-secondary/70"
    }
    if (day.count <= 4) {
      return "bg-emerald-500/25 border-emerald-500/35 hover:bg-emerald-500/40 hover:border-emerald-500/60"
    }
    if (day.count <= 11) {
      return "bg-emerald-500/50 border-emerald-500/65 hover:bg-emerald-500/65 hover:border-emerald-500/85"
    }
    if (day.count <= 24) {
      return "bg-emerald-500/80 border-emerald-400 hover:bg-emerald-500 hover:border-emerald-300"
    }
    // Peak / 25+
    return "bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.45)] hover:bg-emerald-300 hover:border-emerald-200"
  }

  const handleCellMouseEnter = (day: DayActivity, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const isNearTop = rect.top < 130
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: isNearTop ? rect.bottom + 8 : rect.top - 8,
      placement: isNearTop ? "bottom" : "top"
    })
    setHoveredDay(day)
  }

  const handleCellMouseLeave = () => {
    setHoveredDay(null)
    setTooltipPos(null)
  }

  return (
    <div className={`flex-1 w-full h-full min-h-0 flex flex-col justify-between space-y-3 select-none ${className}`}>
      {/* Top Controls Row if requested */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset(prev => prev + 4)}
              className="p-1 rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
              title="Previous 4 weeks"
              aria-label="View previous weeks"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setWeekOffset(prev => Math.max(0, prev - 4))}
              disabled={weekOffset === 0}
              className="p-1 rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              title="Next 4 weeks"
              aria-label="View next weeks"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            {weekOffset > 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer ml-1"
                title="Reset to current period"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                <span>Today</span>
              </button>
            )}
          </div>

          <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5 shrink-0">
            {(["3M", "6M", "1Y"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                  range === r
                    ? "bg-card text-foreground shadow-xs border border-border/10 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary Badges Row */}
      {showSummaryBadges && (
        <div className="grid grid-cols-3 gap-2 shrink-0 pt-0.5">
          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-2.5 flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">Active Days</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-bold text-foreground font-display">
                {stats.activeDays}
              </span>
              <span className="text-[10px] text-muted-foreground">
                / {stats.totalDays} ({stats.consistencyPercent}%)
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-2.5 flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">Range Reviews</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-bold text-emerald-500 font-display">
                {stats.totalReviews}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({stats.totalDurationMinutes}m)
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-2.5 flex flex-col justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">Daily Pace</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-bold text-foreground font-display">
                {stats.avgReviewsPerActiveDay > 0 ? `${stats.avgReviewsPerActiveDay}/day` : "—"}
              </span>
              {stats.maxReviewsInSingleDay > 0 && (
                <span className="text-[10px] text-muted-foreground truncate" title={`Peak: ${stats.maxReviewsInSingleDay} reviews`}>
                  (Pk {stats.maxReviewsInSingleDay})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid Container */}
      <div className="flex-1 min-h-[140px] flex flex-col justify-center overflow-x-auto py-2 px-1">
        <div className="inline-flex flex-col mx-auto min-w-max p-1">
          {/* Month Headers */}
          <div className="flex items-center text-[10px] font-semibold text-muted-foreground h-4 mb-1 pl-7">
            {weeks.map((_, weekIdx) => {
              const labelObj = monthLabels.find(m => m.weekIndex === weekIdx)
              return (
                <div
                  key={`month-${weekIdx}`}
                  className={`${isFullscreen ? "w-4.5 sm:w-5.5" : "w-3.5 sm:w-4"} text-left shrink-0 overflow-visible`}
                >
                  {labelObj ? (
                    <span className="block truncate -ml-0.5 font-bold text-foreground/80">
                      {labelObj.label}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* Heatmap Matrix: 7 rows for days of week */}
          <div className="flex items-start gap-1">
            {/* Day of Week Row Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[9px] font-medium text-muted-foreground/80 pr-1 select-none h-[98px] sm:h-[112px] py-0.5">
              <span className="h-3 sm:h-3.5 flex items-center"></span>
              <span className="h-3 sm:h-3.5 flex items-center">Mon</span>
              <span className="h-3 sm:h-3.5 flex items-center"></span>
              <span className="h-3 sm:h-3.5 flex items-center">Wed</span>
              <span className="h-3 sm:h-3.5 flex items-center"></span>
              <span className="h-3 sm:h-3.5 flex items-center">Fri</span>
              <span className="h-3 sm:h-3.5 flex items-center"></span>
            </div>

            {/* Week Columns */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {weeks.map((week, wIdx) => (
                <div key={`week-${wIdx}`} className="flex flex-col gap-1 sm:gap-1.5 shrink-0">
                  {week.map((day, dIdx) => (
                    <button
                      key={`day-${wIdx}-${dIdx}-${day.dateStr}`}
                      type="button"
                      disabled={day.isFuture}
                      onMouseEnter={(e) => handleCellMouseEnter(day, e)}
                      onMouseLeave={handleCellMouseLeave}
                      className={`relative rounded-xs sm:rounded-sm border transition-all duration-150 cursor-pointer ${
                        isFullscreen
                          ? "w-4 h-4 sm:w-4.5 sm:h-4.5"
                          : "w-3 h-3 sm:w-3.5 sm:h-3.5"
                      } ${getCellColorClass(day)} ${
                        day.isToday ? "ring-2 ring-primary/80 ring-offset-1 ring-offset-card" : ""
                      } hover:brightness-125 hover:ring-2 hover:ring-primary/80 hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
                      aria-label={`${day.dateStr}: ${day.count} reviews`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Legend & Streak Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-1.5 font-medium">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          <span>{stats.consistencyPercent}% practice rate</span>
        </div>

        {/* Legend Scale */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">Less</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs border border-border/40 bg-secondary/40" title="0 reviews" />
            <span className="w-2.5 h-2.5 rounded-xs border border-emerald-500/35 bg-emerald-500/25" title="1-4 reviews" />
            <span className="w-2.5 h-2.5 rounded-xs border border-emerald-500/65 bg-emerald-500/50" title="5-11 reviews" />
            <span className="w-2.5 h-2.5 rounded-xs border border-emerald-400 bg-emerald-500/80" title="12-24 reviews" />
            <span className="w-2.5 h-2.5 rounded-xs border border-emerald-300 bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]" title="25+ reviews" />
          </div>
          <span className="text-[10px]">More</span>
        </div>
      </div>

      {/* Floating Hover Tooltip Portal */}
      {hoveredDay && tooltipPos && typeof document !== "undefined" && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none bg-card/95 backdrop-blur-md border border-border rounded-xl p-2.5 shadow-xl text-left space-y-1 animate-in fade-in zoom-in-95 duration-150 min-w-[165px]"
          style={{
            left: `${Math.max(90, Math.min(window.innerWidth - 90, tooltipPos.x))}px`,
            top: `${tooltipPos.y}px`,
            transform: tooltipPos.placement === "bottom"
              ? "translateX(-50%)"
              : "translate(-50%, -100%)"
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1">
            <span className="font-bold text-foreground text-xs font-display">
              {DAY_NAMES[hoveredDay.date.getDay()]}, {MONTH_NAMES[hoveredDay.date.getMonth()]} {hoveredDay.date.getDate()}
            </span>
            {hoveredDay.isToday && (
              <span className="text-[9px] font-bold text-primary px-1.5 py-0.2 rounded bg-primary/10 uppercase">
                Today
              </span>
            )}
          </div>

          <div className="text-[11px] space-y-0.5 text-muted-foreground pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-foreground">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Reviews:
              </span>
              <span className="font-bold text-foreground font-display">
                {hoveredDay.count}
              </span>
            </div>

            {hoveredDay.count > 0 && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Time:
                  </span>
                  <span className="font-semibold text-foreground">
                    {Math.round((hoveredDay.durationSec / 60) * 10) / 10}m
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Unique Cards:</span>
                  <span className="font-semibold text-foreground">
                    {hoveredDay.uniqueCards}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
