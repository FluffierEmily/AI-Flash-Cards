import { Smartphone, Download, CheckCircle2, RotateCcw, Share2, HelpCircle, Info, Monitor, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

export interface PwaDrawerProps {
  isPwaInstalled: boolean
  canInstallDirectly: boolean
  handleInstallPwa: () => void
}

export function PwaDrawer({ isPwaInstalled, canInstallDirectly, handleInstallPwa }: PwaDrawerProps) {
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const userAgent = navigator.userAgent || ""
      const hasTouch = navigator.maxTouchPoints && navigator.maxTouchPoints > 1
      const isAppleMobile = /iPad|iPhone|iPod/.test(userAgent) || (userAgent.includes("Mac") && hasTouch)
      setIsIOS(!!isAppleMobile)
    }
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Intro info box */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs leading-relaxed text-muted-foreground transition-all duration-300">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Smartphone className="h-4 w-4" />
          Offline Spaced Repetition Engine
        </div>
        <p>
          Installing the app caches all core application scripts, flashcard decks, and revision metrics. You can continue studying uninterrupted even when disconnected from the internet.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-foreground">Installation Status</h4>

        {/* Status card */}
        <div className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between ${isPwaInstalled
          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
          : "border-border bg-secondary/30"
          }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-all duration-300 ${isPwaInstalled
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-muted text-muted-foreground"
              }`}>
              {isPwaInstalled ? <CheckCircle2 className="h-5 w-5 animate-pulse" /> : <Smartphone className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-xs font-semibold">{isPwaInstalled ? "PWA Ready & Installed" : "Not Installed Yet"}</p>
              <p className="text-[11px] text-muted-foreground">
                {isPwaInstalled ? "Running in standalone application mode" : "Web browser mode"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button or Instructions */}
        {isPwaInstalled ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-[11px] text-muted-foreground flex gap-2">
              <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                The app is now fully installable and runs offline. To uninstall or remove from your device, please use your system's app options or browser menu.
              </p>
            </div>

            <button
              onClick={handleInstallPwa}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-accent transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              Reset Simulation State
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {canInstallDirectly ? (
              // Browser supports direct install button
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Your browser supports direct installation. Click the button below to add the application directly to your home screen or applications dock.
                </p>
                <button
                  onClick={handleInstallPwa}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Install PWA
                </button>
              </div>
            ) : (
              // Browser requires manual installation (iOS, Desktop safari, Firefox, etc.)
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    How to Install on this Device
                  </div>

                  {isIOS ? (
                    // iOS Instructions
                    <ul className="text-xs text-muted-foreground space-y-2.5 list-none pl-0">
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600 dark:text-amber-400">1</span>
                        <span>Tap the <strong>Share</strong> button <Share2 className="inline h-3.5 w-3.5 mx-0.5 align-text-bottom text-amber-500" /> in Safari's toolbar.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600 dark:text-amber-400">2</span>
                        <span>Scroll down the options list and tap <strong>"Add to Home Screen"</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600 dark:text-amber-400">3</span>
                        <span>Confirm by tapping <strong>"Add"</strong> in the top right corner.</span>
                      </li>
                    </ul>
                  ) : (
                    // General manual instructions (Firefox, desktop Safari, etc.)
                    <ul className="text-xs text-muted-foreground space-y-2.5 list-none pl-0">
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600 dark:text-amber-400">1</span>
                        <span>Look for the <strong>Install Icon</strong> <Monitor className="inline h-3.5 w-3.5 mx-0.5 align-text-bottom text-amber-500" /> or <strong>"+"</strong> sign in your browser's address bar.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-600 dark:text-amber-400">2</span>
                        <span>Alternatively, open your browser menu (e.g. three dots <ChevronRight className="inline h-3 w-3 rotate-90 text-amber-500" />) and under <strong>"Cast, save and share"</strong> select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</span>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
