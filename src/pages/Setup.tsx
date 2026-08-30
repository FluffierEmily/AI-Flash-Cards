import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  HelpCircle,
  Monitor,
  ChevronRight,
  Plus,
  Sparkles,
  Layers,
  Brain,
  ShieldCheck,
  RotateCcw,
  Upload
} from "lucide-react"
import { ImportWizardModal, type ImportSuccessPayload } from "../components/modals/ImportWizardModal"
import type { Deck } from "../components/Deck/Deck"

interface SetupProps {
  isPwaInstalled: boolean
  canInstallDirectly: boolean
  handleInstallPwa: () => void
  onCreateDeck: () => void
  existingDecks?: Deck[]
  onImportData?: (payload: ImportSuccessPayload) => void
  decksCount?: number
}

export function Setup({
  isPwaInstalled,
  canInstallDirectly,
  handleInstallPwa,
  onCreateDeck,
  existingDecks = [],
  onImportData,
  decksCount = 0
}: SetupProps) {
  const navigate = useNavigate()
  const [isIOS, setIsIOS] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // If a user navigates to /setup when decks already exist, redirect to dashboard on mount
  useEffect(() => {
    if (decksCount > 0) {
      navigate("/dashboard", { replace: true })
    }
  }, [])

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const userAgent = navigator.userAgent || ""
      const hasTouch = navigator.maxTouchPoints && navigator.maxTouchPoints > 1
      const isAppleMobile = /iPad|iPhone|iPod/.test(userAgent) || (userAgent.includes("Mac") && hasTouch)
      setIsIOS(!!isAppleMobile)
    }
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-sm">
        {/* Glow background effects */}
        <div className="absolute top-0 right-0 h-48 w-48 sm:h-64 sm:w-64 bg-gradient-to-bl from-primary/15 via-violet-500/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 sm:h-64 sm:w-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Welcome to AI Flash Cards</span>
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl leading-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              {isPwaInstalled
                ? "You're all set! Start your study journey."
                : "Initial Setup & PWA Installation"}
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {isPwaInstalled
                ? "Your offline environment is ready. Create your first flashcard collection to take advantage of spaced repetition and AI-powered evaluation."
                : "To ensure your flashcards, revision stats, and study reminders are securely stored offline without browser cleanup risk, please install the Progressive Web App (PWA) first."}
            </p>

            {/* Action Buttons (when PWA is installed) */}
            {isPwaInstalled && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={onCreateDeck}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 px-6 py-3 sm:py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-95 hover:scale-[1.02] transition-all duration-200 active:scale-95 shadow-md shadow-primary/25 cursor-pointer group animate-glow-pulse"
                >
                  <Plus className="h-4.5 w-4.5 group-hover:scale-110 transition-transform duration-200" />
                  <span>Create Deck</span>
                  <ChevronRight className="h-4 w-4 stroke-[2.5] ml-0.5 group-hover:translate-x-1 transition-transform duration-200" />
                </button>

                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 hover:bg-secondary hover:border-primary/40 px-5 py-3 sm:py-3.5 text-sm font-semibold text-foreground transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
                >
                  <Upload className="h-4 w-4 text-primary" />
                  <span>Import Data</span>
                </button>
              </div>
            )}
          </div>

          {/* Side Icon / Badge */}
          <div className="flex items-center justify-center shrink-0 self-center md:self-auto">
            <div className="relative flex flex-col items-center justify-center w-28 h-28 sm:w-36 sm:h-36 rounded-3xl border border-border bg-secondary/20 backdrop-blur-xs shadow-inner">
              {isPwaInstalled ? (
                <>
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 className="h-8 w-8 sm:h-9 sm:w-9" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 uppercase tracking-wider">
                    Ready
                  </span>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse-slow">
                    <Smartphone className="h-8 w-8 sm:h-9 sm:w-9" />
                  </div>
                  <span className="text-[10px] font-bold text-rose-500 mt-2 uppercase tracking-wider">
                    Install PWA
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2.5 text-primary">
            <div className="p-2 rounded-xl bg-primary/10">
              <Brain className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Spaced Repetition</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Optimizes your study intervals using adaptive memory models to maximize long-term retention.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2.5 text-violet-500">
            <div className="p-2 rounded-xl bg-violet-500/10">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">AI Answer Grading</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Evaluate free-form answers in natural language with custom LLMs, detailed feedback, and hints.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2.5 text-emerald-500">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Offline-First PWA</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Encrypted client-side storage guarantees full functionality and privacy even with zero internet.
          </p>
        </div>
      </div>

      {/* PWA Installation Guidance (Shown when NOT installed) */}
      {!isPwaInstalled && (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
              <Smartphone className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-foreground">
                Reminder: Please Install the Progressive Web App (PWA)
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Installing this application on your device protects your locally stored decks from automated browser storage evictions, enables full offline support, and allows push notifications for daily study reminders.
              </p>
            </div>
          </div>

          <div className="border-t border-rose-500/10 pt-5">
            {canInstallDirectly ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Your browser supports 1-click installation. Click below to add the application to your home screen or desktop apps.
                </p>
                <button
                  onClick={handleInstallPwa}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm px-6 py-3 hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Install App Now</span>
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                  <span>How to install on your device:</span>
                </div>

                {isIOS ? (
                  <ul className="text-xs text-muted-foreground space-y-2.5 list-none pl-0">
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>
                      <span>Tap the <strong>Share</strong> button <Share2 className="inline h-3.5 w-3.5 mx-0.5 align-text-bottom text-primary" /> in Safari's toolbar.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
                      <span>Scroll down the options list and tap <strong>"Add to Home Screen"</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">3</span>
                      <span>Confirm by tapping <strong>"Add"</strong> in the top right corner.</span>
                    </li>
                  </ul>
                ) : (
                  <ul className="text-xs text-muted-foreground space-y-2.5 list-none pl-0">
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>
                      <span>Look for the <strong>Install Icon</strong> <Monitor className="inline h-3.5 w-3.5 mx-0.5 align-text-bottom text-primary" /> or <strong>"+"</strong> sign in your browser address bar.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
                      <span>Or open your browser menu and select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</span>
                    </li>
                  </ul>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-border">
                  <span className="text-[11px] text-muted-foreground">
                    Developing or testing in a standard browser?
                  </span>
                  <button
                    onClick={handleInstallPwa}
                    className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Simulate PWA Installed
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* When PWA is installed, show helpful next steps and reset simulation option */}
      {isPwaInstalled && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <Layers className="h-5 w-5 text-primary" />
              <h3 className="font-display font-bold text-base text-foreground">
                Next Steps
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              PWA Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/60 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">1</span>
                <span>Create Your Deck</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                Click "Create Deck" above to name your deck and start adding or AI-generating flashcards.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/60 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">2</span>
                <span>Configure AI API Key</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                Set up an API key (e.g. Gemini, OpenAI, Claude) in the header to unlock automatic question generation and smart evaluation.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleInstallPwa}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset PWA simulation state"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Toggle / Reset PWA Simulation</span>
            </button>
          </div>
        </div>
      )}

      {/* Import Wizard Modal */}
      <ImportWizardModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingDecks={existingDecks}
        onImportSuccess={(payload) => {
          if (onImportData) {
            onImportData(payload)
          }
          setIsImportModalOpen(false)
          navigate("/dashboard")
        }}
      />
    </div>
  )
}
