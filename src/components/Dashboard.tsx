import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import {
  Play,
  CheckCircle2,
  TrendingUp,
  Award,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  HelpCircle
} from "lucide-react"
import type { MasteryLevel } from "./Flashcard/Flashcard"

// Types for props
interface DashboardProps {
  totalDue: number
  onStartReview: () => void
}

// Mock data for reviews done over different intervals (days, weeks, months)
const REVIEWS_DATA = {
  days: [
    { label: "Fri", count: 18 },
    { label: "Sat", count: 12 },
    { label: "Sun", count: 8 },
    { label: "Mon", count: 24 },
    { label: "Tue", count: 32 },
    { label: "Wed", count: 27 },
    { label: "Thu", count: 42 }
  ],
  weeks: [
    { label: "Week 1", count: 110 },
    { label: "Week 2", count: 145 },
    { label: "Week 3", count: 128 },
    { label: "Week 4", count: 161 }
  ],
  months: [
    { label: "Mar", count: 380 },
    { label: "Apr", count: 460 },
    { label: "May", count: 510 },
    { label: "Jun", count: 490 },
    { label: "Jul", count: 620 },
    { label: "Aug", count: 680 }
  ]
}

// Mock data for card mastery history over different intervals (days, weeks, months)
const MASTERY_DATA = {
  days: [
    { label: "Fri", weakness: 12, slipUp: 8, learning: 22, proficient: 35, mastered: 45 },
    { label: "Sat", weakness: 14, slipUp: 9, learning: 20, proficient: 37, mastered: 45 },
    { label: "Sun", weakness: 15, slipUp: 7, learning: 18, proficient: 39, mastered: 46 },
    { label: "Mon", weakness: 10, slipUp: 11, learning: 25, proficient: 36, mastered: 49 },
    { label: "Tue", weakness: 8, slipUp: 12, learning: 28, proficient: 34, mastered: 52 },
    { label: "Wed", weakness: 9, slipUp: 6, learning: 23, proficient: 40, mastered: 55 },
    { label: "Thu", weakness: 6, slipUp: 5, learning: 19, proficient: 45, mastered: 60 }
  ],
  weeks: [
    { label: "Week 1", weakness: 15, slipUp: 10, learning: 25, proficient: 32, mastered: 40 },
    { label: "Week 2", weakness: 12, slipUp: 8, learning: 20, proficient: 36, mastered: 48 },
    { label: "Week 3", weakness: 8, slipUp: 6, learning: 22, proficient: 40, mastered: 55 },
    { label: "Week 4", weakness: 6, slipUp: 5, learning: 19, proficient: 45, mastered: 60 }
  ],
  months: [
    { label: "Mar", weakness: 20, slipUp: 15, learning: 30, proficient: 25, mastered: 30 },
    { label: "Apr", weakness: 18, slipUp: 12, learning: 28, proficient: 29, mastered: 35 },
    { label: "May", weakness: 15, slipUp: 10, learning: 26, proficient: 32, mastered: 42 },
    { label: "Jun", weakness: 10, slipUp: 8, learning: 24, proficient: 38, mastered: 49 },
    { label: "Jul", weakness: 8, slipUp: 6, learning: 22, proficient: 42, mastered: 55 },
    { label: "Aug", weakness: 6, slipUp: 5, learning: 19, proficient: 45, mastered: 60 }
  ]
}

interface StatusConfig {
  key: MasteryLevel
  label: string
  color: string
  borderColor: string
  bgColor: string
}

const STATUS_METADATA: StatusConfig[] = [
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

export function Dashboard({ totalDue, onStartReview }: DashboardProps) {
  // Get latest mastery counts for current status display
  const latestHistory = MASTERY_DATA.days[MASTERY_DATA.days.length - 1] as Record<string, any>

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

  const toggleStatusVisibility = (statusKey: MasteryLevel) => {
    setVisibleStatus(prev => ({
      ...prev,
      [statusKey]: !prev[statusKey]
    }))
  }

  // Helper to check if any status line is visible
  const hasVisibleMasteryLines = Object.values(visibleStatus).some(Boolean)

  return (
    <div className="space-y-6">
      {/* Dashboard Overview Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Glow background effects */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-48 w-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display text-foreground tracking-tight sm:text-3xl">
              Welcome back!
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl">
              Keep up your streak to achieve long-term mastery!
            </p>
          </div>

          <div className="flex items-center gap-4 bg-secondary/35 p-4 rounded-2xl border border-border/50 shrink-0">
            <div className="text-center px-4 border-r border-border/70">
              <span className="block text-3xl font-extrabold text-foreground font-display">
                {totalDue}
              </span>
              <span className="text-xs font-medium text-muted-foreground">Reviews Due</span>
            </div>
            <button
              onClick={onStartReview}
              disabled={totalDue === 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition-all duration-200 active:scale-95 shadow-sm shadow-primary/25 disabled:opacity-50 disabled:pointer-events-none cursor-pointer group"
            >
              <Play className="h-4 w-4 fill-current group-hover:scale-110 transition-transform duration-200" />
              <span>Start Review</span>
              <ChevronRight className="h-4 w-4 stroke-[2.5] ml-0.5 group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
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
            <span className="text-2xl font-bold text-foreground font-display">5 Days</span>
            <span className="block text-[10px] text-muted-foreground mt-0.5">Top streak: 12 days</span>
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
            <span className="text-2xl font-bold text-foreground font-display">161</span>
            <span className="block text-[10px] text-muted-foreground mt-0.5">Last 7 days: +42 reviews</span>
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
            <span className="text-2xl font-bold text-foreground font-display">60 / 109</span>
            <span className="block text-[10px] text-muted-foreground mt-0.5">55% of your catalog mastered</span>
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
            <span className="text-2xl font-bold text-foreground font-display">84 mins</span>
            <span className="block text-[10px] text-muted-foreground mt-0.5">Avg: 12 mins per day</span>
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 pt-1">
          {STATUS_METADATA.map((status) => (
            <div
              key={status.key}
              className={`relative group rounded-2xl border p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-xs flex flex-col justify-between ${status.bgColor} ${status.borderColor}`}
            >
              <div className="space-y-1">
                <span
                  className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ color: status.color, border: `1px solid ${status.color}33` }}
                >
                  {status.label}
                </span>
              </div>

              <div className="mt-4">
                <span className="text-3xl font-bold font-display text-foreground">
                  {latestHistory[status.key] ?? 0}
                </span>
                <span className="text-xs font-medium text-muted-foreground ml-1">cards</span>
              </div>

              {/* Tooltip for Success Level */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-popover border border-border text-popover-foreground text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-lg z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200 whitespace-nowrap">
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
          </div>

          <div className="h-[240px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVIEWS_DATA[selectedReviewsInterval]} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
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
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                  itemStyle={{ color: "hsl(var(--primary))" }}
                  labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Reviews Completed"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 4, stroke: "hsl(var(--card))", strokeWidth: 1.5, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 6 }}
                  animationDuration={600}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Card Mastery Over Time */}
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground font-display">Mastery Progression</h3>
            </div>

            {/* Interval selector */}
            <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5 shrink-0 self-start sm:self-center">
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
          </div>

          {/* Interactive Checkbox Legend Grid */}
          <div className="flex flex-wrap gap-2">
            {STATUS_METADATA.map((status) => {
              const isVisible = visibleStatus[status.key]
              return (
                <button
                  key={status.key}
                  onClick={() => toggleStatusVisibility(status.key)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer ${isVisible
                    ? `${status.bgColor} ${status.borderColor}`
                    : "bg-secondary text-muted-foreground border-transparent opacity-60 hover:opacity-85"
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

          <div className="h-[240px] w-full pt-2 relative">
            {!hasVisibleMasteryLines && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/85 backdrop-blur-[1px] z-10 rounded-2xl">
                <Info className="h-6 w-6 text-muted-foreground mb-2 animate-bounce" />
                <p className="text-xs font-semibold text-muted-foreground">Select at least one status level to show lines</p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MASTERY_DATA[selectedMasteryInterval]} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
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
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                  labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))" }}
                />
                {STATUS_METADATA.map((status) => (
                  <Line
                    key={status.key}
                    type="monotone"
                    dataKey={status.key === "slipUp" ? "slipUp" : status.key} // Let's check slipUp data mapping
                    name={status.label}
                    stroke={status.color}
                    strokeWidth={2.2}
                    hide={!visibleStatus[status.key]}
                    dot={{ r: 3.5, stroke: "transparent", fill: status.color }}
                    activeDot={{ r: 5 }}
                    animationDuration={600}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  )
}
