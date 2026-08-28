import { useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts"
import { Clock, Zap, Target, Award, Sparkles } from "lucide-react"
import type { ReviewHistoryRecord } from "../Flashcard/Flashcard"

export interface CardReviewSpeedGraphProps {
  history: ReviewHistoryRecord[]
  className?: string
  height?: number | string
}

interface SpeedPoint {
  attempt: number
  label: string
  dateFormatted: string
  duration: number
  speedCpm: number
  rating: "again" | "hard" | "good" | "easy"
  easeFactor: number
  interval: number
  masteryLevel: string
  userAnswer?: string
  aiScore?: number
  aiFeedback?: string
}

const RATING_COLORS: Record<string, string> = {
  again: "#f43f5e", // Rose-500
  hard: "#f59e0b",  // Amber-500
  good: "#06b6d4",  // Cyan-500
  easy: "#10b981",  // Emerald-500
}

const RATING_LABELS: Record<string, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
}

function CustomCardSpeedTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload as SpeedPoint
  if (!data) return null

  const ratingColor = RATING_COLORS[data.rating] || "#8b5cf6"
  const ratingLabel = RATING_LABELS[data.rating] || data.rating

  return (
    <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-md p-3.5 shadow-xl transition-all duration-200 text-left space-y-2.5 min-w-[210px] text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <span className="font-bold text-foreground font-display flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" />
          Review #{data.attempt}
        </span>
        <span className="text-[10px] text-muted-foreground font-medium">
          {data.dateFormatted}
        </span>
      </div>

      {/* Speed & Duration Metrics */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground/80" />
            Duration:
          </span>
          <span className="font-bold font-display text-foreground text-sm">
            {data.duration.toFixed(1)}s
          </span>
        </div>

        {data.speedCpm > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              Recall Pace:
            </span>
            <span className="font-semibold text-foreground font-display">
              {data.speedCpm.toFixed(1)} cards/min
            </span>
          </div>
        )}
      </div>

      {/* Rating & Resulting Stats */}
      <div className="pt-2 border-t border-border/40 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Rating:</span>
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${ratingColor}15`,
              color: ratingColor,
              border: `1px solid ${ratingColor}30`
            }}
          >
            {ratingLabel}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3 text-muted-foreground/70" />
            Next Interval:
          </span>
          <span className="font-semibold text-foreground">
            {data.interval >= 24
              ? `${Math.round(data.interval / 24)}d (${data.interval}h)`
              : `${data.interval}h`}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground flex items-center gap-1">
            <Award className="h-3 w-3 text-muted-foreground/70" />
            Mastery:
          </span>
          <span className="font-semibold text-foreground capitalize">
            {data.masteryLevel}
          </span>
        </div>
      </div>

      {/* AI Score if available */}
      {data.aiScore !== undefined && (
        <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-violet-400" />
            AI Score:
          </span>
          <span className="font-bold text-violet-400">
            {data.aiScore}%
          </span>
        </div>
      )}
    </div>
  )
}

export function CardReviewSpeedGraph({
  history,
  className = "",
  height = 200
}: CardReviewSpeedGraphProps) {
  const chartData: SpeedPoint[] = useMemo(() => {
    return history.map((rec, index) => {
      const duration = rec.reviewDuration !== undefined ? Math.max(0.1, Number(rec.reviewDuration)) : 0
      const date = new Date(rec.timestamp)
      const dateFormatted = !isNaN(date.getTime())
        ? date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        : rec.timestamp

      const speedCpm = duration > 0 ? 60 / duration : 0

      return {
        attempt: index + 1,
        label: `#${index + 1}`,
        dateFormatted,
        duration,
        speedCpm,
        rating: rec.rating,
        easeFactor: rec.easeFactor,
        interval: rec.interval,
        masteryLevel: rec.masteryLevel,
        userAnswer: rec.userAnswer,
        aiScore: rec.aiEvaluation?.score,
        aiFeedback: rec.aiEvaluation?.feedback
      }
    })
  }, [history])

  const avgDuration = useMemo(() => {
    const valid = chartData.filter((d) => d.duration > 0)
    if (valid.length === 0) return 0
    const sum = valid.reduce((acc, curr) => acc + curr.duration, 0)
    return Number((sum / valid.length).toFixed(1))
  }, [chartData])

  const maxDuration = useMemo(() => {
    if (chartData.length === 0) return 10
    const max = Math.max(...chartData.map((d) => d.duration))
    return Math.max(5, Math.ceil(max * 1.25))
  }, [chartData])

  if (chartData.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-2xl bg-secondary/10 text-center ${className}`}>
        <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-xs font-semibold text-muted-foreground">No review speed data recorded yet.</p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">Speed data is tracked automatically when practicing cards.</p>
      </div>
    )
  }

  const gradientId = "cardSpeedAreaGradient"

  return (
    <div className={`w-full flex flex-col space-y-2 ${className}`}>
      <div className="w-full select-none" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 12,
              right: 15,
              left: -15,
              bottom: 4
            }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
              opacity={0.5}
            />

            <XAxis
              dataKey="label"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, maxDuration]}
              tickFormatter={(val) => `${val}s`}
            />

            <Tooltip content={<CustomCardSpeedTooltip />} />

            {avgDuration > 0 && (
              <ReferenceLine
                y={avgDuration}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{
                  value: `avg ${avgDuration}s`,
                  position: "insideTopRight",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 10,
                  fontWeight: 600
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="duration"
              name="Review Duration"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={(props: any) => {
                const { cx, cy, payload } = props
                if (cx == null || cy == null) return null
                const color = RATING_COLORS[payload?.rating] || "#06b6d4"
                return (
                  <circle
                    key={`dot-${payload?.attempt}-${cx}`}
                    cx={cx}
                    cy={cy}
                    r={4.5}
                    fill={color}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  />
                )
              }}
              activeDot={{
                r: 6.5,
                stroke: "hsl(var(--card))",
                strokeWidth: 2,
                fill: "#06b6d4"
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11px] text-muted-foreground px-1">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground">Rating Dots:</span>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>Again</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>Hard</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
            <span>Good</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Easy</span>
          </div>
        </div>

        {avgDuration > 0 && (
          <div className="flex items-center gap-1.5 font-medium">
            <span>Average Speed:</span>
            <span className="font-bold text-foreground font-display">{avgDuration}s</span>
          </div>
        )}
      </div>
    </div>
  )
}
