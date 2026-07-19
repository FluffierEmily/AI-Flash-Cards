import { useState, useEffect } from "react"
import {
  Sun,
  Moon,
  Sparkles,
  Layers,
  GraduationCap,
  TrendingUp,
  Plus,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Database,
  CloudLightning
} from "lucide-react"

interface Flashcard {
  id: string
  question: string
  answer: string
  category: string
  difficulty: "Easy" | "Medium" | "Hard"
}

const SAMPLE_CARDS: Flashcard[] = [
  {
    id: "1",
    category: "Architecture",
    difficulty: "Medium",
    question: "What is Spaced Repetition?",
    answer: "A learning technique where flashcards are scheduled for review at increasing intervals based on how well you remember them. It exploits the psychological spacing effect to maximize retention."
  },
  {
    id: "2",
    category: "PWA",
    difficulty: "Easy",
    question: "Explain Offline-First Architecture",
    answer: "A design pattern where all data read/write operations are performed against a local database (like IndexedDB) first. Background synchronization handles syncing with server endpoints when online, ensuring the app works without internet."
  },
  {
    id: "3",
    category: "AI & LLMs",
    difficulty: "Hard",
    question: "How does AI scoring improve traditional flashcards?",
    answer: "Traditional cards rely on binary self-grading. AI evaluation analyzes free-form or spoken answers for accuracy, semantic correctness, and completeness, providing detailed corrective feedback."
  }
]

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check local storage or system preference
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme")
      if (saved) return saved === "dark"
      return window.matchMedia("(prefers-color-scheme: dark)").matches
    }
    return true
  })

  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [userAnswer, setUserAnswer] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evalResult, setEvalResult] = useState<{ score: number; feedback: string } | null>(null)

  useEffect(() => {
    const root = window.document.documentElement
    if (darkMode) {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [darkMode])

  const activeCard = SAMPLE_CARDS[activeCardIndex]

  const handleNextCard = () => {
    setIsFlipped(false)
    setEvalResult(null)
    setUserAnswer("")
    setActiveCardIndex((prev) => (prev + 1) % SAMPLE_CARDS.length)
  }

  const simulateAIEvaluation = () => {
    if (!userAnswer.trim()) return
    setIsEvaluating(true)
    setTimeout(() => {
      setIsEvaluating(false)
      const lengthScore = Math.min(100, Math.round((userAnswer.length / activeCard.answer.length) * 100))
      const score = Math.max(10, Math.min(100, lengthScore + Math.floor(Math.random() * 20 - 10)))

      let feedback = ""
      if (score >= 80) {
        feedback = "Excellent! You captured the main concept accurately and provided solid context. Keep it up!"
      } else if (score >= 50) {
        feedback = "Good attempt. You got the core idea, but missed a few key details. Check the answer key below to improve."
      } else {
        feedback = "A bit incomplete. Focus on explaining the mechanism or core principles mentioned in the full answer."
      }
      setEvalResult({ score, feedback })
      setIsFlipped(true)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary/30">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-500 text-primary-foreground shadow-md shadow-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              AI Flash Cards
            </span>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-95 shadow-sm"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-primary px-4 h-10 font-medium text-primary-foreground hover:opacity-90 transition-all duration-200 active:scale-95 shadow-sm shadow-primary/20">
              <Plus className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">New Deck</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto py-8 px-4 sm:px-6">
        {/* Welcome Section */}
        <section className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Styling and UI Foundation Ready
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-3">
            Supercharge Your Study Sessions
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            A beautiful, offline-first application combining spaced repetition learning with AI-powered answers and intelligent feedback.
          </p>
        </section>

        {/* Info Cards / Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 dark:bg-violet-400/10 dark:text-violet-400 group-hover:scale-110 transition-transform duration-200">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Local Decks</p>
              <h3 className="text-2xl font-bold font-display">4 Active</h3>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-200">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reviews Due</p>
              <h3 className="text-2xl font-bold font-display">12 Cards</h3>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
              <h3 className="text-2xl font-bold font-display">94.2%</h3>
            </div>
          </div>
        </section>

        {/* Study Sandbox and Interactive Demo */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Card Showcase - Left & Center Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Flashcard Container */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />

              {/* Card Meta Header */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Card {activeCardIndex + 1} of {SAMPLE_CARDS.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    {activeCard.category}
                  </span>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${activeCard.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-500" :
                    activeCard.difficulty === "Medium" ? "bg-amber-500/10 text-amber-500" :
                      "bg-rose-500/10 text-rose-500"
                    }`}>
                    {activeCard.difficulty}
                  </span>
                </div>
              </div>

              {/* Card Body - Dual States */}
              <div className="min-h-[160px] flex flex-col justify-center mb-6">
                {!isFlipped ? (
                  <div>
                    <h2 className="font-display text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl">
                      {activeCard.question}
                    </h2>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Question</p>
                      <h4 className="font-medium text-foreground text-base sm:text-lg">{activeCard.question}</h4>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Official Answer</p>
                      <p className="text-foreground leading-relaxed text-sm sm:text-base">
                        {activeCard.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Input section & controls */}
              {!isFlipped && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="answer-input" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      Your Written Answer
                      <span className="text-xs text-muted-foreground font-normal">(AI will score accuracy)</span>
                    </label>
                    <textarea
                      id="answer-input"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type your explanation or memory of the answer here..."
                      className="w-full min-h-[100px] rounded-xl border border-border bg-background p-4 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={simulateAIEvaluation}
                      disabled={isEvaluating || !userAnswer.trim()}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 h-12 font-semibold text-primary-foreground hover:opacity-95 transition-all duration-200 active:scale-98 shadow-sm shadow-primary/25 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {isEvaluating ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          AI Evaluating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          Evaluate with AI
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setIsFlipped(true)}
                      className="rounded-xl border border-border px-5 h-12 font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-98 shadow-sm"
                    >
                      Reveal Answer
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback and Results */}
              {isFlipped && (
                <div className="space-y-5">
                  {evalResult && (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-foreground">AI Scoring Report</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-extrabold text-primary font-display">{evalResult.score}</span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {evalResult.feedback}
                      </p>

                      {/* Metric bar visualizer */}
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500 rounded-full"
                          style={{ width: `${evalResult.score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-3 pt-3 border-t border-border">
                    <button
                      onClick={() => setIsFlipped(false)}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      Back to Prompt
                    </button>
                    <button
                      onClick={handleNextCard}
                      className="flex items-center gap-2 rounded-xl bg-foreground px-5 h-11 text-sm font-semibold text-background hover:bg-foreground/90 transition-all duration-200 active:scale-95 shadow-sm"
                    >
                      Next Flashcard
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Application Features Highlights */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Technical Roadmap Highlights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/50 border border-border">
                  <Database className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-0.5">IndexedDB Sync</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Local store for full offline capabilities and persistent card histories.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/50 border border-border">
                  <CloudLightning className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-0.5">PWA Installation</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Vite PWA caching config with service workers for sub-second offline launches.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Decks and Instructions */}
          <div className="flex flex-col gap-6">
            {/* Quick settings panel */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display font-bold text-lg mb-4">Study Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-foreground block">Spaced Repetition</label>
                    <span className="text-xs text-muted-foreground">Adjust intervals based on score</span>
                  </div>
                  <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-primary transition-colors">
                    <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-primary-foreground transition-transform" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-foreground block">Voice Synthesis</label>
                    <span className="text-xs text-muted-foreground">Read card question aloud</span>
                  </div>
                  <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-secondary transition-colors">
                    <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-card transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* List of Decks Mockup */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg">Your Decks</h3>
                <span className="text-xs font-semibold text-primary cursor-pointer hover:underline">View All</span>
              </div>
              <div className="space-y-3">
                {[
                  { title: "System Architecture", count: 24, due: 3, color: "from-blue-500 to-indigo-500" },
                  { title: "Progressive Web Apps", count: 15, due: 5, color: "from-purple-500 to-pink-500" },
                  { title: "Artificial Intelligence", count: 18, due: 4, color: "from-amber-500 to-orange-500" },
                ].map((deck, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border hover:border-primary/20 bg-card hover:bg-secondary/20 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8.5 w-8.5 rounded-lg bg-gradient-to-tr ${deck.color} opacity-85 group-hover:scale-105 transition-transform duration-200`} />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{deck.title}</h4>
                        <span className="text-xs text-muted-foreground">{deck.count} cards</span>
                      </div>
                    </div>
                    {deck.due > 0 ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {deck.due} due
                      </span>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16 py-8">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 AI Flash Cards. Designed with pure aesthetics and offline capability.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="cursor-pointer hover:text-foreground transition-colors">Privacy</span>
            <span className="cursor-pointer hover:text-foreground transition-colors">Terms</span>
            <span className="cursor-pointer hover:text-foreground transition-colors">Docs</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
