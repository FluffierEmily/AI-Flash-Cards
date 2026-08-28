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
import { Zap, Clock, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useGraphNavigation } from "./useGraphNavigation"
import { GraphNavigationControls } from "./GraphNavigationControls"
import type { SpeedGrowthDataPoint } from "../../lib/statistics"

export interface SpeedGrowthGraphProps {
  data: SpeedGrowthDataPoint[]
  interval?: "days" | "weeks" | "months"
  onIntervalChange?: (interval: "days" | "weeks" | "months") => void
  isFullscreen?: boolean
  showIntervalSelector?: boolean
  enableInteractions?: boolean
  showInteractionControls?: boolean
}

// Custom tooltip for rich speed analytics
function CustomSpeedGrowthTooltip({
  active,
  payload,
  label,
  isFullscreen
}: any) {
  if (!active || !payload || !payload.length) return null

  const dataPoint = payload[0]?.payload as SpeedGrowthDataPoint
  if (!dataPoint) return null

  const isPositive = dataPoint.growth > 0
  const isNegative = dataPoint.growth < 0

  return (
    <div
      className={`rounded-2xl border border-border bg-card/95 backdrop-blur-md p-3.5 shadow-xl transition-all duration-200 text-left space-y-2.5 min-w-[200px] ${
        isFullscreen ? "text-sm p-4 min-w-[240px]" : "text-xs"
      }`}
    >
      {/* Tooltip Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <span className="font-bold text-foreground font-display">
          {label || dataPoint.label}
        </span>
        <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded-md bg-secondary">
          {dataPoint.count} {dataPoint.count === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* Speed Growth Metric */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
          <span>Speed Growth:</span>
        </div>
        <div
          className={`flex items-center gap-0.5 font-bold font-display ${
            isPositive
              ? "text-emerald-500"
              : isNegative
                ? "text-rose-500"
                : "text-muted-foreground"
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
          ) : isNegative ? (
            <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" />
          ) : null}
          <span>
            {dataPoint.growth > 0 ? `+${dataPoint.growth}%` : `${dataPoint.growth}%`}
          </span>
        </div>
      </div>

      {/* Additional Speed Metrics if reviews exist */}
      {dataPoint.count > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border/40 text-muted-foreground">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              Avg Time:
            </span>
            <span className="font-semibold text-foreground font-display">
              {dataPoint.avgDuration}s / card
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-muted-foreground" />
              Pace:
            </span>
            <span className="font-semibold text-foreground font-display">
              {dataPoint.avgSpeed} cards/min
            </span>
          </div>
        </div>
      )}

      {dataPoint.count === 0 && (
        <div className="text-[10px] text-muted-foreground/80 italic text-center pt-0.5">
          No reviews on this day
        </div>
      )}
    </div>
  )
}

export function SpeedGrowthGraph({
  data,
  interval = "days",
  onIntervalChange,
  isFullscreen = false,
  showIntervalSelector = false,
  enableInteractions = true,
  showInteractionControls = true
}: SpeedGrowthGraphProps) {
  const nav = useGraphNavigation({
    data,
    interval,
    enabled: enableInteractions
  })

  const gradientId = isFullscreen
    ? "speedGrowthGradientFullscreen"
    : "speedGrowthGradient"

  // Calculate dynamic split gradient offset where y = 0
  const off = useMemo(() => {
    const visible = nav.visibleData
    if (!visible || visible.length === 0) return 0.5

    const dataMax = Math.max(...visible.map((d: any) => d.growth ?? 0), 0)
    const dataMin = Math.min(...visible.map((d: any) => d.growth ?? 0), 0)

    if (dataMax <= 0) return 0
    if (dataMin >= 0) return 1

    return dataMax / (dataMax - dataMin)
  }, [nav.visibleData])

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col space-y-2.5">
      {/* Top Interval Switcher if requested */}
      {showIntervalSelector && onIntervalChange && (
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5 shrink-0">
            {(["days", "weeks", "months"] as const).map((intv) => (
              <button
                key={intv}
                onClick={() => onIntervalChange(intv)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 capitalize cursor-pointer ${
                  interval === intv
                    ? "bg-card text-foreground shadow-xs border border-border/10 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {intv}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart container */}
      <div
        ref={nav.containerRef}
        className="flex-1 w-full min-h-0 pt-1 select-none"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={nav.visibleData}
            margin={{
              top: isFullscreen ? 15 : 10,
              right: isFullscreen ? 25 : 10,
              left: isFullscreen ? 0 : -15,
              bottom: isFullscreen ? 15 : 5
            }}
          >
            <defs>
              {/* Split fill gradient: Cyan/Emerald for positive growth, Rose for negative growth */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset={off} stopColor="#06b6d4" stopOpacity={0.05} />
                <stop offset={off} stopColor="#f43f5e" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.4} />
              </linearGradient>

              {/* Split line stroke gradient */}
              <linearGradient id={`${gradientId}-stroke`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                <stop offset={off} stopColor="#06b6d4" stopOpacity={1} />
                <stop offset={off} stopColor="#f43f5e" stopOpacity={1} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={1} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
              opacity={0.6}
            />

            {/* 0% Baseline reference line */}
            <ReferenceLine
              y={0}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              strokeOpacity={0.8}
            />

            <XAxis
              dataKey="label"
              stroke="hsl(var(--muted-foreground))"
              fontSize={isFullscreen ? 13 : 11}
              tickLine={false}
              axisLine={false}
              dy={isFullscreen ? 8 : 0}
            />

            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={isFullscreen ? 13 : 11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value > 0 ? `+${value}` : value}%`}
              dx={isFullscreen ? -5 : 0}
            />

            <Tooltip
              content={<CustomSpeedGrowthTooltip isFullscreen={isFullscreen} />}
            />

            <Area
              type="monotone"
              dataKey="growth"
              name="Speed Growth"
              stroke={`url(#${gradientId}-stroke)`}
              strokeWidth={isFullscreen ? 3.5 : 2.5}
              fill={`url(#${gradientId})`}
              baseValue={0}
              dot={(props: any) => {
                const { cx, cy, payload } = props
                if (cx == null || cy == null) return null
                const isPos = (payload?.growth ?? 0) >= 0
                const color = isPos ? "#06b6d4" : "#f43f5e"
                return (
                  <circle
                    key={`dot-${payload?.label}-${cx}`}
                    cx={cx}
                    cy={cy}
                    r={isFullscreen ? 5 : 4}
                    fill={color}
                    stroke="hsl(var(--card))"
                    strokeWidth={isFullscreen ? 2 : 1.5}
                  />
                )
              }}
              activeDot={{
                r: isFullscreen ? 7 : 6,
                stroke: "hsl(var(--card))",
                strokeWidth: isFullscreen ? 2.5 : 2,
                fill: "#0891b2"
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Navigation & Zoom Controls */}
      {enableInteractions && showInteractionControls && (
        <GraphNavigationControls
          canScrollPast={nav.canScrollPast}
          canScrollFuture={nav.canScrollFuture}
          canZoomIn={nav.canZoomIn}
          canZoomOut={nav.canZoomOut}
          isModified={nav.isModified}
          windowSize={nav.windowSize}
          totalPoints={nav.totalPoints}
          interval={interval}
          offsetFromEnd={nav.offsetFromEnd}
          onScrollPast={() => nav.scrollPast(1)}
          onScrollFuture={() => nav.scrollFuture(1)}
          onZoomIn={() => nav.zoomIn(1)}
          onZoomOut={() => nav.zoomOut(1)}
          onReset={nav.reset}
          className="w-full shrink-0"
        />
      )}
    </div>
  )
}

// Named alias for convenience
export const SpeedGrowth = SpeedGrowthGraph
