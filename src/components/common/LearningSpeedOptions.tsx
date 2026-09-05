import { useState, useEffect } from "react"
import { Gauge, HelpCircle, ChevronUp, ChevronDown } from "lucide-react"
import type { SettingsState, DailyLearningLimitMode } from "../../pages/Settings"
import { getDailyLearningLimit } from "../../lib/spacedRepetition"

export interface LearningSpeedOptionsProps {
  settings?: SettingsState
  onUpdateSetting?: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  layout?: "responsive" | "column" | "row"
  showLabel?: boolean
  collapsibleOnMobile?: boolean
  className?: string
  onSelectOption?: () => void
}

export function LearningSpeedOptions({
  settings,
  onUpdateSetting,
  layout = "responsive",
  showLabel = false,
  collapsibleOnMobile = false,
  className = "",
  onSelectOption
}: LearningSpeedOptionsProps) {
  const dailyLimit = settings ? getDailyLearningLimit(settings) : 10
  const [customLimitInput, setCustomLimitInput] = useState(() => String(dailyLimit))
  const [isEditingCustom, setIsEditingCustom] = useState(false)
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)

  useEffect(() => {
    if (settings?.dailyLearningLimit) {
      setCustomLimitInput(String(settings.dailyLearningLimit))
    }
  }, [settings?.dailyLearningLimit])

  const effectiveLayout =
    layout === "responsive"
      ? settings?.speedOptionsResponsive === false
        ? "row"
        : "responsive"
      : layout

  const isColumn = effectiveLayout === "column"
  const isRow = effectiveLayout === "row"
  // const isResponsive = effectiveLayout === "responsive"

  const containerClasses = isColumn
    ? "w-full flex flex-col items-stretch gap-1.5 p-1.5 rounded-xl bg-secondary/40 backdrop-blur-md border border-border/70 shadow-xs"
    : isRow
      ? "inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/40 backdrop-blur-md border border-border/70 shadow-xs shrink-0"
      : "w-full sm:w-auto shrink-0 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-1 p-1.5 sm:p-1 rounded-xl bg-secondary/40 backdrop-blur-md border border-border/70 shadow-xs"

  const optionsWrapperClasses = isColumn
    ? "flex flex-col items-stretch gap-1 w-full"
    : isRow
      ? "flex items-center gap-1"
      : "flex flex-col sm:flex-row items-stretch sm:items-center gap-1 w-full sm:w-auto"

  const buttonClasses = (isSelected: boolean, forceColumn: boolean = false) => {
    const base = isColumn || forceColumn
      ? "flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border w-full"
      : isRow
        ? "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer border shrink-0"
        : "flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-lg text-xs transition-colors cursor-pointer border w-full sm:w-auto"

    const state = isSelected
      ? "bg-card text-foreground shadow-xs border-border/80 font-semibold"
      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-card/40 font-medium"

    return `${base} ${state}`
  }

  const currentMode =
    settings?.dailyLearningLimitMode ||
    (dailyLimit === 10
      ? "balanced"
      : dailyLimit === 20
        ? "advanced"
        : dailyLimit === 30
          ? "challenging"
          : "custom")

  const selectedTitle =
    currentMode === "balanced"
      ? "Balanced"
      : currentMode === "advanced"
        ? "Advanced"
        : currentMode === "challenging"
          ? "Challenging"
          : "Custom"

  const selectedCount =
    currentMode === "custom"
      ? dailyLimit
      : currentMode === "balanced"
        ? 10
        : currentMode === "advanced"
          ? 20
          : 30

  const renderOptionsList = (isMobileList: boolean = false) => (
    <>
      {[
        { id: "balanced", title: "Balanced", count: 10 },
        { id: "advanced", title: "Advanced", count: 20 },
        { id: "challenging", title: "Challenging", count: 30 }
      ].map((opt) => {
        const isSelected = currentMode === opt.id

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              onUpdateSetting?.("dailyLearningLimit", opt.count)
              onUpdateSetting?.("dailyLearningLimitMode", opt.id as DailyLearningLimitMode)
              setIsEditingCustom(false)
              if (isMobileList) {
                setIsMobileExpanded(false)
              }
              onSelectOption?.()
            }}
            className={buttonClasses(isSelected, isMobileList)}
          >
            <span>{opt.title}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${isSelected
                  ? "bg-primary/15 text-primary font-bold"
                  : "bg-muted/80 text-muted-foreground font-semibold"
                }`}
            >
              {opt.count}
            </span>
          </button>
        )
      })}

      {/* Custom Option */}
      {(() => {
        const isSelected = currentMode === "custom"

        return (
          <div
            onClick={() => {
              onUpdateSetting?.("dailyLearningLimitMode", "custom")
              const customVal =
                dailyLimit && ![10, 20, 30].includes(dailyLimit) ? dailyLimit : 15
              onUpdateSetting?.("dailyLearningLimit", customVal)
              setCustomLimitInput(String(customVal))
              setIsEditingCustom(true)
              onSelectOption?.()
            }}
            className={buttonClasses(isSelected, isMobileList)}
          >
            <span>Custom</span>
            {isSelected ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center rounded-md bg-primary/10 border border-primary/25 overflow-hidden shadow-2xs shrink-0"
              >
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={customLimitInput}
                  autoFocus={isEditingCustom}
                  onChange={(e) => {
                    const valStr = e.target.value
                    setCustomLimitInput(valStr)
                    const parsed = parseInt(valStr)
                    if (!isNaN(parsed) && parsed >= 1) {
                      onUpdateSetting?.("dailyLearningLimit", parsed)
                      onUpdateSetting?.("dailyLearningLimitMode", "custom")
                    }
                  }}
                  onBlur={() => {
                    setIsEditingCustom(false)
                    if (!customLimitInput || parseInt(customLimitInput) < 1) {
                      const fallback = 15
                      setCustomLimitInput(String(fallback))
                      onUpdateSetting?.("dailyLearningLimit", fallback)
                    }
                  }}
                  className="w-8 px-1 py-0.5 text-[11px] font-mono font-bold text-center bg-transparent text-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="x"
                  aria-label="Custom daily learning limit"
                />
                <div className="flex flex-col border-l border-primary/20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const cur = parseInt(customLimitInput) || dailyLimit || 15
                      const next = Math.min(500, cur + 1)
                      setCustomLimitInput(String(next))
                      onUpdateSetting?.("dailyLearningLimit", next)
                      onUpdateSetting?.("dailyLearningLimitMode", "custom")
                    }}
                    className="h-3 w-3.5 flex items-center justify-center text-primary/70 hover:text-primary hover:bg-primary/20 active:bg-primary/30 transition-colors cursor-pointer"
                    title="Increase"
                    aria-label="Increase daily limit"
                  >
                    <ChevronUp className="h-2.5 w-2.5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const cur = parseInt(customLimitInput) || dailyLimit || 15
                      const next = Math.max(1, cur - 1)
                      setCustomLimitInput(String(next))
                      onUpdateSetting?.("dailyLearningLimit", next)
                      onUpdateSetting?.("dailyLearningLimitMode", "custom")
                    }}
                    className="h-3 w-3.5 flex items-center justify-center text-primary/70 hover:text-primary hover:bg-primary/20 active:bg-primary/30 transition-colors cursor-pointer border-t border-primary/20"
                    title="Decrease"
                    aria-label="Decrease daily limit"
                  >
                    <ChevronDown className="h-2.5 w-2.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            ) : (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-muted/80 text-muted-foreground font-semibold shrink-0">
                {dailyLimit && ![10, 20, 30].includes(dailyLimit) ? dailyLimit : "x"}
              </span>
            )}
          </div>
        )
      })()}
    </>
  )

  const renderHeaderLabel = () => (
    <div
      className={
        isColumn
          ? "flex items-center justify-between gap-1.5 px-2.5 py-1 text-muted-foreground border-b border-border/30 pb-1.5"
          : isRow
            ? "flex items-center gap-1.5 pl-2.5 pr-1 text-muted-foreground"
            : "flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1 sm:py-0 sm:pl-2.5 sm:pr-1 text-muted-foreground border-b border-border/30 sm:border-b-0 pb-1.5 sm:pb-0"
      }
    >
      <div className="flex items-center gap-1.5">
        <Gauge className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs font-semibold text-foreground whitespace-nowrap">
          Learning Speed
        </span>
      </div>
      <div className="relative group leading-none">
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/70 hover:text-foreground transition-colors cursor-help" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-popover border border-border text-popover-foreground text-xs p-2.5 rounded-lg shadow-lg z-30 pointer-events-none w-56 leading-relaxed font-normal animate-in fade-in slide-in-from-bottom-1 duration-200 text-center sm:text-left">
          Controls how many new cards are introduced each day.
        </div>
      </div>
    </div>
  )

  return (
    <div className={`w-full sm:w-auto shrink-0 ${className}`}>
      {/* Collapsible button for mobile view when enabled */}
      {collapsibleOnMobile && (
        <div className="sm:hidden w-full flex flex-col gap-1.5">
          <div
            onClick={() => setIsMobileExpanded((prev) => !prev)}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-secondary/40 backdrop-blur-md border border-border/70 shadow-xs w-full text-xs font-medium cursor-pointer transition-colors hover:bg-secondary/60 active:scale-[0.99]"
            role="button"
            tabIndex={0}
            aria-expanded={isMobileExpanded}
            aria-label="Toggle learning speed options"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setIsMobileExpanded((prev) => !prev)
              }
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <Gauge className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground whitespace-nowrap">Learning Speed</span>
              <div
                className="relative group leading-none"
                onClick={(e) => e.stopPropagation()}
              >
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/70 hover:text-foreground transition-colors cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-popover border border-border text-popover-foreground text-xs p-2.5 rounded-lg shadow-lg z-30 pointer-events-none w-56 leading-relaxed font-normal animate-in fade-in slide-in-from-bottom-1 duration-200 text-left">
                  Controls how many new cards are introduced each day.
                </div>
              </div>
              <span className="text-muted-foreground font-semibold -ml-0.5">:</span>
              <span className="font-semibold text-foreground capitalize truncate">{selectedTitle}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/15 text-primary font-bold">
                {selectedCount}
              </span>
            </div>

            <ChevronDown
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ${isMobileExpanded ? "rotate-180" : ""
                }`}
            />
          </div>

          {isMobileExpanded && (
            <div className="flex flex-col items-stretch gap-1 w-full p-1.5 rounded-xl bg-secondary/40 backdrop-blur-md border border-border/70 shadow-xs animate-in fade-in slide-in-from-top-1 duration-150">
              {renderOptionsList(true)}
            </div>
          )}
        </div>
      )}

      {/* Standard desktop view (or standard non-collapsible mobile view) */}
      <div
        className={`${containerClasses} ${collapsibleOnMobile ? "hidden sm:inline-flex" : ""
          }`}
      >
        {showLabel && renderHeaderLabel()}
        <div className={optionsWrapperClasses}>
          {renderOptionsList(false)}
        </div>
      </div>
    </div>
  )
}
