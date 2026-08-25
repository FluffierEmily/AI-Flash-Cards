import { useNavigate } from "react-router-dom"
import {
  Settings as SettingsIcon,
  Shuffle,
  Bell,
  Volume2,
  Sparkles,
  RotateCcw,
  Zap,
  Gauge,
  Layers,
  Clock,
  HelpCircle,
  Save,
  ArrowLeft,
  X
} from "lucide-react"

import { DEFAULT_EVAL_PROMPT } from "../lib/aiEvaluation"
import { DEFAULT_HINT_PROMPT } from "../lib/aiHints"

export interface SettingsState {
  cardShuffle: boolean
  spacedRepetition: boolean
  dailyReviewLimit: number // 0 = unlimited
  dynamicNewCards: boolean
  newCardsPerDay: number
  targetRetention: string
  reminderInterval: number // due cards count trigger
  voiceSynthesis: boolean
  autoFlipSeconds: number // 0 = disabled
  autoHintSeconds: number // 0 = disabled
  enable3dFlip: boolean
  darkMode: boolean
  aiEvalPrompt: string
  aiModelProvider: string
  aiModelName: string
  aiHintPrompt: string
}

export const DEFAULT_SETTINGS: SettingsState = {
  cardShuffle: false,
  spacedRepetition: true,
  dailyReviewLimit: 0,
  dynamicNewCards: true,
  newCardsPerDay: 20,
  targetRetention: "90",
  reminderInterval: 10,
  voiceSynthesis: false,
  autoFlipSeconds: 0,
  autoHintSeconds: 0,
  enable3dFlip: true,
  darkMode: true,
  aiEvalPrompt: DEFAULT_EVAL_PROMPT,
  aiModelProvider: "Google",
  aiModelName: "gemini-3.6-flash",
  aiHintPrompt: DEFAULT_HINT_PROMPT
}

export interface SettingsProps {
  settings: SettingsState
  onUpdateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  onResetDefaults: () => void
  onOpenDrawerStep?: (step: "apiKey" | "pwa" | "fcm") => void
  onResetData?: () => void
}

function SettingTooltip({ text }: { text: string }) {
  return (
    <div className="relative group/tooltip inline-flex items-center shrink-0">
      <button
        type="button"
        className="p-0.5 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-accent focus:outline-none focus:text-foreground transition-colors cursor-help"
        aria-label="More information"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tooltip:block group-focus-within/tooltip:block w-48 sm:w-56 p-2 bg-popover text-popover-foreground text-xs font-normal leading-relaxed rounded-xl shadow-lg border border-border z-30 pointer-events-none text-center">
        {text}
      </div>
    </div>
  )
}

export function Settings({
  settings,
  onUpdateSetting,
  onResetDefaults,
  onOpenDrawerStep,
  onResetData
}: SettingsProps) {
  const navigate = useNavigate()

  return (
    <div className="max-w-3xl mx-auto bg-card border border-border shadow-xl rounded-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="p-5 md:px-7 md:py-5 border-b border-border flex items-center justify-between bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 id="settings-page-title" className="font-display font-bold text-xl md:text-2xl text-foreground flex items-center gap-2">
              Settings
            </h2>
          </div>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1.5 text-sm font-semibold cursor-pointer border border-border/40"
          aria-label="Back to dashboard"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Form Content */}
      <div className="p-5 md:p-7 divide-y divide-border/60">
        {/* Card Shuffle Row */}
        <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Shuffle className="h-4 w-4 text-emerald-500 shrink-0" />
            <label className="text-sm font-semibold text-foreground cursor-pointer truncate" htmlFor="toggle-card-shuffle">
              Card Shuffle
            </label>
            <SettingTooltip text="Shuffles cards due from different decks instead of grouping them by deck and showing them sequentially." />
          </div>
          <button
            id="toggle-card-shuffle"
            type="button"
            role="switch"
            aria-checked={settings.cardShuffle}
            onClick={() => onUpdateSetting("cardShuffle", !settings.cardShuffle)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${settings.cardShuffle ? "bg-emerald-500" : "bg-muted"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.cardShuffle ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>

        {/* SRS Repetition Engine Row */}
        <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="h-4 w-4 text-amber-500 shrink-0" />
            <label className="text-sm font-semibold text-foreground cursor-pointer truncate" htmlFor="toggle-srs">
              SRS Repetition Engine
            </label>
            <SettingTooltip text="Automatically adjusts review intervals based on card recall performance." />
          </div>
          <button
            id="toggle-srs"
            type="button"
            role="switch"
            aria-checked={settings.spacedRepetition}
            onClick={() => onUpdateSetting("spacedRepetition", !settings.spacedRepetition)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${settings.spacedRepetition ? "bg-primary" : "bg-muted"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.spacedRepetition ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>

        {/* Daily Review Limit Row */}
        <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Gauge className="h-4 w-4 text-blue-500 shrink-0" />
            <label className="text-sm font-semibold text-foreground cursor-pointer truncate" htmlFor="input-daily-review-limit">
              Daily Review Limit
            </label>
            <SettingTooltip text="Maximum number of review cards per day. Enter 0 for unlimited." />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground hidden sm:inline-block">
              {settings.dailyReviewLimit === 0 ? "Unlimited" : `${settings.dailyReviewLimit} cards`}
            </span>
            <input
              id="input-daily-review-limit"
              type="number"
              min={0}
              max={1000}
              value={settings.dailyReviewLimit}
              onChange={(e) => onUpdateSetting("dailyReviewLimit", Math.max(0, parseInt(e.target.value) || 0))}
              className="w-24 h-9 px-3 rounded-xl border border-input bg-card text-foreground font-mono text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="0"
            />
          </div>
        </div>

        {/* Dynamic New Cards Row */}
        <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />
            <label className="text-sm font-semibold text-foreground cursor-pointer truncate" htmlFor="toggle-dynamic-new-cards">
              Dynamic New Cards
            </label>
            <SettingTooltip
              text={
                settings.dynamicNewCards
                  ? "Adaptive: automatically scales daily new cards up or down based on recent recall performance."
                  : "Fixed daily new card limit manually configured below."
              }
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!settings.dynamicNewCards && (
              <div className="flex items-center gap-1.5">
                <label htmlFor="input-new-cards-per-day" className="text-xs text-muted-foreground hidden sm:inline">
                  Fixed/day:
                </label>
                <input
                  id="input-new-cards-per-day"
                  type="number"
                  min={1}
                  max={200}
                  value={settings.newCardsPerDay}
                  onChange={(e) => onUpdateSetting("newCardsPerDay", Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-9 px-2 rounded-xl border border-input bg-card text-foreground font-mono text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}
            <button
              id="toggle-dynamic-new-cards"
              type="button"
              role="switch"
              aria-checked={settings.dynamicNewCards}
              onClick={() => onUpdateSetting("dynamicNewCards", !settings.dynamicNewCards)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${settings.dynamicNewCards ? "bg-purple-500" : "bg-muted"
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.dynamicNewCards ? "translate-x-6" : "translate-x-1"
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Target Retention Rate Row */}
        <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="h-4 w-4 text-cyan-500 shrink-0" />
            <label className="text-sm font-semibold text-foreground cursor-pointer truncate" htmlFor="select-target-retention">
              Target Retention Rate
            </label>
            <SettingTooltip text="Determines target probability of successfully recalling flashcards prior to scheduling reviews." />
          </div>
          <select
            id="select-target-retention"
            value={settings.targetRetention}
            onChange={(e) => onUpdateSetting("targetRetention", e.target.value)}
            className="w-44 h-9 px-3 rounded-xl border border-input bg-card text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer shrink-0"
          >
            <option value="85">85% - Fast Review</option>
            <option value="90">90% - Standard</option>
            <option value="95">95% - Deep Mastery</option>
          </select>
        </div>

        {/* Reminder Interval Row */}
        <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="h-4 w-4 text-amber-500 shrink-0" />
            <label className="text-sm font-semibold text-foreground cursor-pointer truncate" htmlFor="input-reminder-interval">
              Reminder Interval
            </label>
            <SettingTooltip text="Determines after how many due cards a study reminder notification should be sent." />
            {onOpenDrawerStep && (
              <button
                type="button"
                onClick={() => {
                  onOpenDrawerStep("fcm")
                }}
                className="text-xs text-primary hover:underline font-medium cursor-pointer shrink-0 ml-2 hidden sm:inline"
              >
                FCM Setup
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex gap-1">
              {[5, 10, 20, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onUpdateSetting("reminderInterval", num)}
                  className={`px-2.5 h-9 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer ${settings.reminderInterval === num
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-secondary text-foreground"
                    }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <input
              id="input-reminder-interval"
              type="number"
              min={1}
              max={500}
              value={settings.reminderInterval}
              onChange={(e) => onUpdateSetting("reminderInterval", Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 h-9 px-2 rounded-xl border border-input bg-card text-foreground font-mono text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="10"
            />
          </div>
        </div>

        {/* Voice Synthesis Row */}
        <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Volume2 className="h-4 w-4 text-indigo-500 shrink-0" />
            <label className="text-sm font-semibold text-foreground cursor-pointer truncate" htmlFor="toggle-voice-synthesis">
              Voice Synthesis
            </label>
            <SettingTooltip text="Automatically reads flashcard questions and answers aloud using text-to-speech." />
          </div>
          <button
            id="toggle-voice-synthesis"
            type="button"
            role="switch"
            aria-checked={settings.voiceSynthesis}
            onClick={() => onUpdateSetting("voiceSynthesis", !settings.voiceSynthesis)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${settings.voiceSynthesis ? "bg-indigo-500" : "bg-muted"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.voiceSynthesis ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>

        {/* 3D Flip Animation Row */}
        <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-pink-500 shrink-0" />
            <label className="text-sm font-semibold text-foreground cursor-pointer truncate" htmlFor="toggle-3d-flip">
              3D Flip Animation
            </label>
            <SettingTooltip text="Enable realistic 3D perspective flip rotation on cards when revealing answers." />
          </div>
          <button
            id="toggle-3d-flip"
            type="button"
            role="switch"
            aria-checked={settings.enable3dFlip}
            onClick={() => onUpdateSetting("enable3dFlip", !settings.enable3dFlip)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${settings.enable3dFlip ? "bg-pink-500" : "bg-muted"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enable3dFlip ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>

        {/* Auto-Reveal Answer Delay Row */}
        <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="h-4 w-4 text-teal-500 shrink-0" />
            <label className="text-sm font-semibold text-foreground cursor-pointer truncate" htmlFor="input-auto-flip">
              Auto-Reveal Answer Delay
            </label>
            <SettingTooltip text="Seconds before automatically flipping card to reveal answer. Set 0 to disable." />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground hidden sm:inline-block">
              {settings.autoFlipSeconds === 0 ? "Disabled" : `${settings.autoFlipSeconds}s`}
            </span>
            <input
              id="input-auto-flip"
              type="number"
              min={0}
              max={120}
              value={settings.autoFlipSeconds}
              onChange={(e) => onUpdateSetting("autoFlipSeconds", Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 h-9 px-2 rounded-xl border border-input bg-card text-foreground font-mono text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="0"
            />
          </div>
        </div>

        {/* Auto-Show Hint Delay Row */}
        <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <HelpCircle className="h-4 w-4 text-orange-500 shrink-0" />
            <label className="text-sm font-semibold text-foreground cursor-pointer truncate" htmlFor="input-auto-hint">
              Auto-Show Hint Delay
            </label>
            <SettingTooltip text="Seconds before automatically displaying AI hint if available. Set 0 to disable." />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground hidden sm:inline-block">
              {settings.autoHintSeconds === 0 ? "Disabled" : `${settings.autoHintSeconds}s`}
            </span>
            <input
              id="input-auto-hint"
              type="number"
              min={0}
              max={120}
              value={settings.autoHintSeconds}
              onChange={(e) => onUpdateSetting("autoHintSeconds", Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 h-9 px-2 rounded-xl border border-input bg-card text-foreground font-mono text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="0"
            />
          </div>
        </div>

        {/* AI Evaluation Prompt Section */}
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />
            <label className="text-sm font-semibold text-foreground cursor-pointer" htmlFor="input-ai-eval-prompt">
              AI Evaluation Prompt
            </label>
            <SettingTooltip text="Customize the guidelines used by the AI to grade your answers. Use {question}, {referenceAnswer}, and {userAnswer} placeholder tags to inject flashcard data." />
          </div>
          <textarea
            id="input-ai-eval-prompt"
            rows={6}
            value={settings.aiEvalPrompt}
            onChange={(e) => onUpdateSetting("aiEvalPrompt", e.target.value)}
            className="w-full p-3 rounded-xl border border-input bg-card text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y leading-relaxed"
            placeholder="Enter custom AI evaluation instructions..."
          />
        </div>

        {/* AI Hint Prompt Section */}
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
            <label className="text-sm font-semibold text-foreground cursor-pointer" htmlFor="input-ai-hint-prompt">
              AI Hint Generation Prompt
            </label>
            <SettingTooltip text="Customize the guidelines used by the AI to generate hints. Use {question}, {answer}, and {count} placeholder tags to inject flashcard context." />
          </div>
          <textarea
            id="input-ai-hint-prompt"
            rows={6}
            value={settings.aiHintPrompt}
            onChange={(e) => onUpdateSetting("aiHintPrompt", e.target.value)}
            className="w-full p-3 rounded-xl border border-input bg-card text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y leading-relaxed"
            placeholder="Enter custom AI hint generation instructions..."
          />
        </div>

        {/* Danger Zone Section */}
        <div className="py-4 space-y-3 bg-destructive/5 -mx-5 md:-mx-7 px-5 md:px-7 rounded-b-xl border-t border-destructive/20">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-destructive">Danger Zone</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Resetting will clear all spaced repetition review intervals, ease factors, next review due dates, and all card review history. This action cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Are you sure you want to reset all card due dates and delete all review history? This cannot be undone.")) {
                onResetData?.()
              }
            }}
            className="px-4 h-10 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            Reset Due Dates & History
          </button>
        </div>
      </div>

      {/* Page Footer */}
      <div className="p-5 md:px-7 md:py-4 border-t border-border bg-secondary/30 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onResetDefaults}
          className="px-4 h-10 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-xs font-semibold text-muted-foreground transition-colors flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Defaults
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="px-6 h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Save className="h-4 w-4" />
          Save & Return
        </button>
      </div>
    </div>
  )
}
