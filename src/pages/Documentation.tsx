import { useNavigate } from "react-router-dom"
import {
  X,
  Brain,
  Clock,
  TrendingUp,
  Activity
} from "lucide-react"

export function Documentation() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-foreground tracking-tight">
            Algorithm Documentation
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            Understand how our dynamic spaced repetition system optimizes your learning.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center justify-center h-11 w-11 rounded-xl border border-border bg-card hover:bg-secondary/80 text-foreground transition-all duration-200 cursor-pointer active:scale-95 shadow-xs shrink-0"
          aria-label="Close Documentation"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Intro Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20 shrink-0">
            <Brain className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Recall-Optimized Spaced Repetition (RO-SR)
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Standard spaced repetition algorithms (like SM-2) calculate memory decay based purely on your qualitative feedback (e.g. rating a card as "easy" or "hard"). Our system enhances this by introducing two key innovations: **hour-based scheduling** and **recall-duration calibration**.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Hour-Based Scheduling */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
              <Clock className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-bold text-lg text-foreground font-display">Hour-Based Scheduling</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Instead of standard day-based intervals which limit reviews to daily cycles, intervals are tracked in hours. This permits immediate feedback and re-testing for failed cards during the same day.
          </p>
          <div className="bg-secondary/40 rounded-2xl p-4 border border-border/50 space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Base Review Steps</h4>
            <ul className="text-sm space-y-2.5 text-muted-foreground">
              <li className="flex justify-between border-b border-border/40 pb-2">
                <span className="font-medium text-foreground">Failed Card (Again)</span>
                <span className="font-semibold text-rose-500">4 Hours</span>
              </li>
              <li className="flex justify-between border-b border-border/40 pb-2">
                <div>
                  <span className="block font-medium text-foreground">First Review (Repetition = 0)</span>
                  <span className="text-xs text-muted-foreground">Adjusted per rating selected</span>
                </div>
                <span className="font-semibold text-foreground text-right">
                  Hard: 8h<br />
                  Good: 24h<br />
                  Easy: 48h
                </span>
              </li>
              <li className="flex justify-between border-b border-border/40 pb-2">
                <div>
                  <span className="block font-medium text-foreground">Second Review (Repetition = 1)</span>
                  <span className="text-xs text-muted-foreground">Stabilization phase</span>
                </div>
                <span className="font-semibold text-foreground text-right">
                  Hard: 24h<br />
                  Good: 96h (4d)<br />
                  Easy: 168h (7d)
                </span>
              </li>
              <li className="flex justify-between">
                <div>
                  <span className="block font-medium text-foreground">Subsequent Reviews (Repetition &gt; 1)</span>
                  <span className="text-xs text-muted-foreground">Multiplied exponentially</span>
                </div>
                <span className="font-semibold text-primary">Interval × Ease Factor</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Recall-Duration Calibration */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
              <Activity className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-bold text-lg text-foreground font-display">Recall-Duration Calibration</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your response time serves as a direct proxy for recall confidence. Faster answers represent high fluency and solid consolidation, while slow answers show hesitation and memory decay.
          </p>
          
          <div className="bg-secondary/40 rounded-2xl p-4 border border-border/50 space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">How Baseline is Determined</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every card builds its own history. The system compares your response duration against the card's **previous review duration** (`lastReviewDuration`).
            </p>
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              *If a card has never been reviewed, the baseline is estimated using word count: between 8s and 25s (calculated as 0.5s per word + 5s base recall overhead).*
            </p>
          </div>
        </div>

      </div>

      {/* Formula & Deviation Details */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <TrendingUp className="h-5.5 w-5.5" />
          </div>
          <h3 className="font-bold text-lg text-foreground font-display">Relative Deviation Formulas</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          
          {/* Math Card */}
          <div className="lg:col-span-1 bg-secondary/30 rounded-2xl p-5 border border-border/50 flex flex-col justify-center items-center text-center space-y-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Relative Deviation</span>
            <div className="bg-card px-4 py-3 rounded-xl border border-border font-mono text-sm text-foreground shadow-xs">
              deviation = (T<sub>curr</sub> - T<sub>base</sub>) / T<sub>base</sub>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Computes the percentage difference between your current time and the baseline.
            </p>
          </div>

          {/* Adjustments details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Fluency Bonus (deviation &lt; 0)</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When you answer faster than your baseline (improvement), the next review interval receives a **boost of up to 1.2x** (`1.0 - deviation * 0.3`). This rewards high fluency by pushing the next review date further out.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Hesitation Penalty (deviation &gt; 0)</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When you take longer than your baseline (regression), the interval shrinks **down to 0.4x** (`1.0 - deviation * 0.6`) to schedule it sooner. Additionally, your card's growth factor is decelerated by adjusting the quality score downward (up to `-1.5` reduction).
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Extreme Hesitation (deviation &gt; 1.0)</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you take more than twice as long as your baseline to answer, it signifies critical memory degradation. Even if marked correct, the card's mastery level is automatically reset back to <span className="font-semibold text-blue-500">Learning</span>.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
