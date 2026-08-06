import { Smartphone, Download } from "lucide-react"

export interface PwaDrawerProps {
  isPwaInstalled: boolean
  handleInstallPwa: () => void
}

export function PwaDrawer({ isPwaInstalled, handleInstallPwa }: PwaDrawerProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
        <div className="flex items-center gap-2 text-blue-500 font-semibold text-sm">
          <Smartphone className="h-4 w-4" />
          Offline Spaced Repetition Engine
        </div>
        <p>
          Installing the app caches all core application scripts, flashcard decks, and revision metrics. You can continue studying uninterrupted even when disconnected from the internet.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-foreground">Installation Status</h4>
        <div className="p-4 rounded-xl border border-border bg-secondary/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPwaInstalled ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">{isPwaInstalled ? "PWA Ready & Installed" : "Not Installed Yet"}</p>
              <p className="text-[11px] text-muted-foreground">{isPwaInstalled ? "Running in standalone application mode" : "Web browser mode"}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleInstallPwa}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-sm cursor-pointer"
        >
          <Download className="h-4 w-4" />
          {isPwaInstalled ? "Uninstall / Reset PWA State" : "Install PWA"}
        </button>
      </div>
    </div>
  )
}
