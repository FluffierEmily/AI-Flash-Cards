import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  X,
  Brain,
  Clock,
  SlidersHorizontal,
  MoveHorizontal,
  ZoomIn,
  Maximize2,
  RotateCcw,
  ListTree,
  ChevronDown,
  ChevronRight,
  Activity,
  TrendingUp,
  LineChart
} from "lucide-react"

interface NavTreeItem {
  id: string
  label: string
  icon: React.ReactNode
  children?: { id: string; label: string }[]
}

const NAV_TREE: NavTreeItem[] = [
  {
    id: "graph-controls",
    label: "Graph Controls",
    icon: <LineChart className="h-4 w-4 text-violet-500" />,
    children: [
      { id: "graph-pan", label: "Scroll into Past (Pan)" },
      { id: "graph-zoom", label: "Zoom & Window Size" },
      { id: "graph-fullscreen", label: "Fullscreen Modal" }
    ]
  },
  {
    id: "spaced-repetition",
    label: "Spaced Repetition",
    icon: <Brain className="h-4 w-4 text-primary" />,
    children: [
      { id: "ro-sr", label: "Recall-Optimized SR" },
      { id: "hour-based-scheduling", label: "Hour-Based Scheduling" },
      { id: "recall-duration-calibration", label: "Recall-Duration Calibration" },
      { id: "math-deviation", label: "Relative Deviation" },
      { id: "fluency-bonus", label: "Fluency Bonus" },
      { id: "hesitation-penalty", label: "Hesitation Penalty" },
      { id: "extreme-hesitation", label: "Extreme Hesitation" }
    ]
  }
]

export function Documentation() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState<string>("graph-controls")
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  // Collapsed by default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Scrollspy observer to highlight active section in the tree navbar
  useEffect(() => {
    const sectionIds: string[] = []
    NAV_TREE.forEach(parent => {
      sectionIds.push(parent.id)
      parent.children?.forEach(child => sectionIds.push(child.id))
    })

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120
      let currentSectionId = activeId

      for (const id of sectionIds) {
        const element = document.getElementById(id)
        if (element) {
          const top = element.offsetTop
          const height = element.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentSectionId = id
            break
          }
        }
      }
      setActiveId(currentSectionId)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [activeId])

  // Handle direct hash navigation on initial load
  useEffect(() => {
    if (window.location.hash) {
      const hashId = window.location.hash.replace("#", "")
      const element = document.getElementById(hashId)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" })
          setActiveId(hashId)
          // Also expand parent if child was targeted
          NAV_TREE.forEach(parent => {
            if (parent.id === hashId || parent.children?.some(c => c.id === hashId)) {
              setExpandedSections(prev => ({ ...prev, [parent.id]: true }))
            }
          })
        }, 100)
      }
    }
  }, [])

  const handleScrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
      setActiveId(id)
      setIsMobileNavOpen(false)
      window.history.replaceState(null, "", `#${id}`)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Documentation
          </h1>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center justify-center h-11 w-11 rounded-xl border border-border bg-card hover:bg-secondary/80 text-foreground transition-all duration-200 cursor-pointer active:scale-95 shadow-xs shrink-0"
          aria-label="Close Documentation"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Main Two-Column Layout with Tree Navbar */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Navigation Sidebar / Tree Navbar */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 z-20">
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            {/* Navbar Header / Mobile Toggle */}
            <button
              onClick={() => setIsMobileNavOpen(prev => !prev)}
              className="w-full flex items-center justify-between p-4 bg-secondary/30 lg:bg-transparent text-left cursor-pointer lg:cursor-default"
            >
              <div className="flex items-center gap-2 text-foreground font-bold text-sm font-display">
                <ListTree className="h-4 w-4 text-primary" />
                <span>Documentation Tree</span>
              </div>
              <span className="lg:hidden text-muted-foreground">
                {isMobileNavOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
            </button>

            {/* Tree Links List */}
            <nav
              aria-label="Documentation tree navigation"
              className={`p-3 space-y-2 ${isMobileNavOpen ? "block" : "hidden lg:block"}`}
            >
              {NAV_TREE.map((section) => {
                const isParentActive = activeId === section.id || section.children?.some(c => c.id === activeId)
                const isExpanded = !!expandedSections[section.id]

                return (
                  <div key={section.id} className="space-y-1">
                    {/* Parent Section Node */}
                    <div className="flex items-center justify-between gap-1">
                      <a
                        href={`#${section.id}`}
                        onClick={(e) => {
                          handleScrollTo(e, section.id)
                          // Auto expand when clicking parent
                          setExpandedSections(prev => ({ ...prev, [section.id]: true }))
                        }}
                        className={`flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${activeId === section.id
                          ? "bg-primary/15 text-primary font-bold shadow-2xs"
                          : isParentActive
                            ? "text-foreground font-bold hover:bg-secondary/60"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                          }`}
                      >
                        <span className="shrink-0">{section.icon}</span>
                        <span className="truncate">{section.label}</span>
                      </a>

                      {section.children && section.children.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            toggleSection(section.id)
                          }}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 cursor-pointer transition-colors shrink-0"
                          aria-label={isExpanded ? `Collapse ${section.label}` : `Expand ${section.label}`}
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90 text-foreground" : ""}`} />
                        </button>
                      )}
                    </div>

                    {/* Children Sub-tree with Branch Lines (Collapsed by default) */}
                    {isExpanded && section.children && section.children.length > 0 && (
                      <div className="ml-4 pl-3 border-l-2 border-border/60 space-y-1 pt-0.5 animate-in fade-in duration-200">
                        {section.children.map((child) => {
                          const isChildActive = activeId === child.id

                          return (
                            <a
                              key={child.id}
                              href={`#${child.id}`}
                              onClick={(e) => handleScrollTo(e, child.id)}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-all duration-150 cursor-pointer ${isChildActive
                                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 font-medium"
                                }`}
                            >
                              <span className="truncate">{child.label}</span>
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Documentation Content Area */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* Graph Controls Section */}
          <section id="graph-controls" className="scroll-mt-24">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 text-violet-500 rounded-xl border border-violet-500/20">
                  <SlidersHorizontal className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground font-display">
                    Graph Controls
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Explore long-term learning history with dynamic pan, zoom, and fullscreen capabilities.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
                {/* Feature 1: Pan & Time Travel */}
                <div id="graph-pan" className="scroll-mt-24 bg-secondary/30 rounded-2xl p-5 border border-border/50 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <MoveHorizontal className="h-4 w-4" />
                      <span>Scroll into Past</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Navigate seamlessly through up to 30 days, 16 weeks, or 18 months of past reviews and mastery history.
                    </p>
                  </div>

                  <div className="bg-card/70 rounded-xl p-3 border border-border/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Mouse Wheel:</span>
                      <span className="font-mono text-foreground font-medium">Scroll Up / Left</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Toolbar Buttons:</span>
                      <span className="font-mono text-foreground font-medium">◀ and ▶</span>
                    </div>
                  </div>
                </div>

                {/* Feature 2: Zoom & Window Resizing */}
                <div id="graph-zoom" className="scroll-mt-24 bg-secondary/30 rounded-2xl p-5 border border-border/50 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-violet-500 font-semibold text-sm">
                      <ZoomIn className="h-4 w-4" />
                      <span>Zoom & Window Size</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Widen or narrow the data window to inspect micro daily fluctuations or broad multi-month learning trajectories.
                    </p>
                  </div>

                  <div className="bg-card/70 rounded-xl p-3 border border-border/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Mouse Wheel:</span>
                      <span className="font-mono text-foreground font-medium">Ctrl + Scroll</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Toolbar Buttons:</span>
                      <span className="font-mono text-foreground font-medium">− and +</span>
                    </div>
                  </div>
                </div>

                {/* Feature 3: Fullscreen & Filters */}
                <div id="graph-fullscreen" className="scroll-mt-24 bg-secondary/30 rounded-2xl p-5 border border-border/50 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
                      <Maximize2 className="h-4 w-4" />
                      <span>Fullscreen Modal</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Open charts in an expanded fullscreen overlay with full interactive interval toggles and mastery category filters.
                    </p>
                  </div>

                  <div className="bg-card/70 rounded-xl p-3 border border-border/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Expand Chart:</span>
                      <span className="font-mono text-foreground font-medium">Top-Right Button</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Close Modal:</span>
                      <span className="font-mono text-foreground font-medium">Esc / Minimize</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips / Summary Banner */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
                <div className="flex items-center gap-2.5 text-foreground">
                  <RotateCcw className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    <strong>Quick Reset:</strong> Whenever a graph is scrolled or zoomed, a <span className="font-semibold text-primary">Reset</span> button will appear on the toolbar to restore the default window.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Divider between first-level items */}
          <div className="py-13 sm:py-13" aria-hidden="true">
            <hr className="border-t border-border/70" />
          </div>

          {/* Spaced Repetition Section */}
          <section id="spaced-repetition" className="scroll-mt-24">
            <div id="ro-sr" className="scroll-mt-24 relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
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
                    Standard spaced repetition algorithms (like SM-2) calculate memory decay based purely on your qualitative feedback (e.g. rating a card as &quot;easy&quot; or &quot;hard&quot;). Our system enhances this by introducing two key innovations: <strong className="text-foreground font-semibold">hour-based scheduling</strong> and <strong className="text-foreground font-semibold">recall-duration calibration</strong>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Scheduling & Calibration Grid */}
          <section id="scheduling-mechanics" className="scroll-mt-24 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hour-Based Scheduling */}
              <div id="hour-based-scheduling" className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
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
              <div id="recall-duration-calibration" className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
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
                    Every card builds its own history. The system compares your response duration against the card&apos;s <strong className="text-foreground font-semibold">previous review duration</strong> (<code className="px-1.5 py-0.5 rounded-md bg-secondary text-foreground text-xs font-mono">lastReviewDuration</code>).
                  </p>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    If a card has never been reviewed, the baseline is estimated using word count: between 8s and 25s (calculated as 0.5s per word + 5s base recall overhead).
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Formula & Deviation Details */}
          <section id="relative-deviation" className="scroll-mt-24">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                  <TrendingUp className="h-5.5 w-5.5" />
                </div>
                <h3 className="font-bold text-lg text-foreground font-display">Relative Deviation Formulas</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Math Card */}
                <div id="math-deviation" className="scroll-mt-24 lg:col-span-1 bg-secondary/30 rounded-2xl p-5 border border-border/50 flex flex-col justify-center items-center text-center space-y-3">
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
                  <div id="fluency-bonus" className="scroll-mt-24 space-y-2">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Fluency Bonus (deviation &lt; 0)</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      When you answer faster than your baseline (improvement), the next review interval receives a <strong className="text-foreground font-semibold">boost of up to 1.2x</strong> (<code className="px-1.5 py-0.5 rounded-md bg-secondary text-foreground text-xs font-mono">1.0 - deviation * 0.3</code>). This rewards high fluency by pushing the next review date further out.
                    </p>
                  </div>

                  <div id="hesitation-penalty" className="scroll-mt-24 space-y-2">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Hesitation Penalty (deviation &gt; 0)</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      When you take longer than your baseline (regression), the interval shrinks <strong className="text-foreground font-semibold">down to 0.4x</strong> (<code className="px-1.5 py-0.5 rounded-md bg-secondary text-foreground text-xs font-mono">1.0 - deviation * 0.6</code>) to schedule it sooner. Additionally, your card&apos;s growth factor is decelerated by adjusting the quality score downward (up to <code className="px-1.5 py-0.5 rounded-md bg-secondary text-foreground text-xs font-mono">-1.5</code> reduction).
                    </p>
                  </div>

                  <div id="extreme-hesitation" className="scroll-mt-24 space-y-2">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Extreme Hesitation (deviation &gt; 1.0)</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      If you take more than twice as long as your baseline to answer, it signifies critical memory degradation. Even if marked correct, the card&apos;s mastery level is automatically reset back to <span className="font-semibold text-blue-500">Learning</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

