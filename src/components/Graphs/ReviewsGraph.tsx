import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { useGraphNavigation } from "./useGraphNavigation"
import { GraphNavigationControls } from "./GraphNavigationControls"

export interface ReviewsGraphProps {
  data: { label: string; count: number }[]
  interval?: "days" | "weeks" | "months"
  onIntervalChange?: (interval: "days" | "weeks" | "months") => void
  isFullscreen?: boolean
  showIntervalSelector?: boolean
  enableInteractions?: boolean
  showInteractionControls?: boolean
}

export function ReviewsGraph({
  data,
  interval = "days",
  onIntervalChange,
  isFullscreen = false,
  showIntervalSelector = false,
  enableInteractions = true,
  showInteractionControls = true
}: ReviewsGraphProps) {
  const nav = useGraphNavigation({
    data,
    interval,
    enabled: enableInteractions
  })

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col space-y-2.5">
      {/* Top Controls Row */}
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

      {/* Chart container with non-passive mousewheel listener */}
      <div
        ref={nav.containerRef}
        className="flex-1 w-full min-h-0 pt-1 select-none"
      >
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
              itemStyle={{ color: "hsl(var(--primary))", fontWeight: 600 }}
              labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))" }}
            />
            <Line
              type="monotone"
              dataKey="count"
              name="Reviews Completed"
              stroke="hsl(var(--primary))"
              strokeWidth={isFullscreen ? 3.5 : 2.5}
              dot={{
                r: isFullscreen ? 5 : 4,
                stroke: "hsl(var(--card))",
                strokeWidth: isFullscreen ? 2 : 1.5,
                fill: "hsl(var(--primary))"
              }}
              activeDot={{
                r: isFullscreen ? 7 : 6,
                stroke: "hsl(var(--card))",
                strokeWidth: isFullscreen ? 2.5 : 2,
                fill: "hsl(var(--primary))"
              }}
            />
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
