import { Link } from "react-router-dom"
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react"

export interface GraphNavigationControlsProps {
  canScrollPast: boolean
  canScrollFuture: boolean
  canZoomIn: boolean
  canZoomOut: boolean
  isModified: boolean
  windowSize: number
  totalPoints: number
  interval?: "days" | "weeks" | "months"
  offsetFromEnd: number
  onScrollPast: () => void
  onScrollFuture: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  className?: string
}

export function GraphNavigationControls({
  canScrollPast,
  canScrollFuture,
  canZoomIn,
  canZoomOut,
  isModified,
  windowSize,
  totalPoints,
  interval = "days",
  offsetFromEnd,
  onScrollPast,
  onScrollFuture,
  onZoomIn,
  onZoomOut,
  onReset,
  className = ""
}: GraphNavigationControlsProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 p-1.5 px-2.5 rounded-xl bg-secondary/40 border border-border/60 text-xs ${className}`}
    >
      {/* Left: Interactive Navigation Button Groups */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Pan / Scroll Group */}
        <div className="flex items-center rounded-lg border border-border/80 bg-card p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={onScrollPast}
            disabled={!canScrollPast}
            className="p-1 rounded-md text-foreground hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            title="Scroll into past (Mousewheel up or left)"
            aria-label="Scroll graph into past"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onScrollFuture}
            disabled={!canScrollFuture}
            className="p-1 rounded-md text-foreground hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            title="Scroll to present (Mousewheel down or right)"
            aria-label="Scroll graph to present"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Zoom In / Out Group */}
        <div className="flex items-center rounded-lg border border-border/80 bg-card p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={!canZoomOut}
            className="p-1 rounded-md text-foreground hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            title="Zoom out (Increase window size / Ctrl + Wheel down)"
            aria-label="Zoom out graph"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            disabled={!canZoomIn}
            className="p-1 rounded-md text-foreground hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            title="Zoom in (Decrease window size / Ctrl + Wheel up)"
            aria-label="Zoom in graph"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Reset Button */}
        {isModified && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border/80 bg-card text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shadow-2xs animate-in fade-in"
            title="Reset to default window"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Right: Info and Documentation Link */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground shrink-0 ml-auto">
        <span className="font-medium">
          Window: <strong className="text-foreground">{windowSize}</strong>/{totalPoints} {interval}
          {offsetFromEnd > 0 && (
            <span className="ml-1 text-primary font-semibold">({offsetFromEnd} {interval} ago)</span>
          )}
        </span>
        <span className="text-muted-foreground/60">|</span>
        <Link
          to="/documentation#graph-controls"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card hover:bg-secondary text-foreground hover:text-primary font-medium text-[11px] border border-border/80 transition-all duration-150 cursor-pointer shadow-2xs"
          title="View Graph Controls Documentation"
        >
          <span>?</span>
        </Link>
      </div>
    </div>
  )
}
