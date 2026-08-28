import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { Info } from "lucide-react"
import type { MasteryLevel } from "../Flashcard/Flashcard"
import { useGraphNavigation } from "./useGraphNavigation"
import { GraphNavigationControls } from "./GraphNavigationControls"

export interface StatusConfig {
  key: MasteryLevel
  label: string
  color: string
  borderColor: string
  bgColor: string
}

export const STATUS_METADATA: StatusConfig[] = [
  {
    key: "weakness",
    label: "Weakness",
    color: "#f43f5e", // Rose 500
    borderColor: "border-rose-500/30",
    bgColor: "bg-rose-500/10"
  },
  {
    key: "slipUp",
    label: "Slip-up",
    color: "#f59e0b", // Amber 500
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/10"
  },
  {
    key: "learning",
    label: "Learning",
    color: "#3b82f6", // Blue 500
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10"
  },
  {
    key: "proficient",
    label: "Proficient",
    color: "#8b5cf6", // Violet 500
    borderColor: "border-violet-500/30",
    bgColor: "bg-violet-500/10"
  },
  {
    key: "mastered",
    label: "Mastered",
    color: "#10b981", // Emerald 500
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/10"
  }
]

export interface MasteryGraphProps {
  data: any[]
  interval?: "days" | "weeks" | "months"
  onIntervalChange?: (interval: "days" | "weeks" | "months") => void
  visibleStatus: Record<MasteryLevel, boolean>
  onToggleStatus: (statusKey: MasteryLevel) => void
  isFullscreen?: boolean
  showIntervalSelector?: boolean
  enableInteractions?: boolean
  showInteractionControls?: boolean
}

export function MasteryGraph({
  data,
  interval = "days",
  onIntervalChange,
  visibleStatus,
  onToggleStatus,
  isFullscreen = false,
  showIntervalSelector = false,
  enableInteractions = true,
  showInteractionControls = true
}: MasteryGraphProps) {
  const hasVisibleMasteryLines = Object.values(visibleStatus).some(Boolean)
  const nav = useGraphNavigation({
    data,
    interval,
    enabled: enableInteractions
  })

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col space-y-2.5">
      {/* Controls: Interval selector & Mastery toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        {/* Interactive Checkbox Legend Grid */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_METADATA.map((status) => {
            const isVisible = visibleStatus[status.key]
            return (
              <button
                key={status.key}
                onClick={() => onToggleStatus(status.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isVisible
                    ? `${status.bgColor} ${status.borderColor}`
                    : "bg-secondary/70 text-muted-foreground border-transparent opacity-60 hover:opacity-90"
                }`}
                style={{ color: isVisible ? status.color : undefined }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-md border shrink-0 transition-all duration-200"
                  style={{
                    backgroundColor: isVisible ? status.color : "transparent",
                    borderColor: isVisible ? status.color : "currentColor"
                  }}
                />
                {status.label}
              </button>
            )
          })}
        </div>

        {showIntervalSelector && onIntervalChange && (
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
        )}
      </div>

      {/* Chart container with non-passive mousewheel listener */}
      <div
        ref={nav.containerRef}
        className="flex-1 w-full min-h-0 relative pt-1 select-none"
      >
        {!hasVisibleMasteryLines && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/85 backdrop-blur-[1px] z-10 rounded-2xl">
            <Info className="h-6 w-6 text-muted-foreground mb-2 animate-bounce" />
            <p className="text-xs font-semibold text-muted-foreground">
              Select at least one status level to show lines
            </p>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={nav.visibleData}
            margin={{
              top: isFullscreen ? 15 : 5,
              right: isFullscreen ? 25 : 10,
              left: isFullscreen ? 0 : -20,
              bottom: isFullscreen ? 15 : 5
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
              opacity={0.6}
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
              allowDecimals={false}
              dx={isFullscreen ? -5 : 0}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
                fontSize: isFullscreen ? "13px" : "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
              }}
              labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))" }}
            />
            {STATUS_METADATA.map((status) => (
              <Line
                key={status.key}
                type="monotone"
                dataKey={status.key === "slipUp" ? "slipUp" : status.key}
                name={status.label}
                stroke={status.color}
                strokeWidth={isFullscreen ? 3 : 2.2}
                hide={!visibleStatus[status.key]}
                dot={{
                  r: isFullscreen ? 4.5 : 3.5,
                  stroke: "transparent",
                  fill: status.color
                }}
                activeDot={{ r: isFullscreen ? 7 : 5 }}
                animationDuration={400}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Navigation & Zoom Toolbar underneath the graph */}
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
