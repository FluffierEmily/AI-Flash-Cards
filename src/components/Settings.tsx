import {
  Settings,
  X,
  Shuffle,
  Bell,
  Volume2,
  Sparkles,
  RotateCcw,
  Zap,
  Gauge,
  Clock,
  HelpCircle,
  Layers,
  Save
} from "lucide-react"

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
  darkMode: true
}

export interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: SettingsState
  onUpdateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  onResetDefaults: () => void
  onOpenDrawerStep?: (step: "apiKey" | "pwa" | "fcm") => void
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

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onResetDefaults,
  onOpenDrawerStep
}: SettingsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop Overlay with Blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200 cursor-pointer"
        aria-hidden="true"
      />

      {/* Bottom Sheet Modal Drawer */}
      <aside
        className="relative z-10 w-full max-w-3xl mx-auto bg-card border-t border-x border-border shadow-2xl rounded-t-3xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-labelledby="settings-modal-title"
      >
        {/* Modal Header */}
        <div className="p-5 md:px-7 md:py-5 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="font-display font-bold text-xl md:text-2xl text-foreground flex items-center gap-2">
                Settings
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-5 md:p-7 overflow-y-auto divide-y divide-border/60">
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
                    onClose()
                    onOpenDrawerStep("fcm")
                  }}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer shrink-0 ml-1 hidden sm:inline"
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
        </div>

        {/* Modal Footer */}
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
            onClick={onClose}
            className="px-6 h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </aside>
    </div>
  )
}
