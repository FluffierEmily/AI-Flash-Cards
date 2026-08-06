import { Key, Smartphone, Bell, X } from "lucide-react"
import { ApiKeyDrawer, type ApiKeyDrawerProps } from "./ApiKeyDrawer"
import { PwaDrawer, type PwaDrawerProps } from "./PwaDrawer"
import { FcmDrawer, type FcmDrawerProps } from "./FcmDrawer"

export type SetupStep = "apiKey" | "pwa" | "fcm" | null

export interface SetupDrawerProps {
  activeDrawerStep: SetupStep
  onClose: () => void
  apiKeyProps: ApiKeyDrawerProps
  pwaProps: PwaDrawerProps
  fcmProps: FcmDrawerProps
}

export function SetupDrawer({
  activeDrawerStep,
  onClose,
  apiKeyProps,
  pwaProps,
  fcmProps
}: SetupDrawerProps) {
  if (!activeDrawerStep) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Content Container */}
      <aside className="relative z-10 w-full max-w-lg bg-card h-full border-l border-border shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div>
          <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                {activeDrawerStep === "apiKey" && <Key className="h-6 w-6" />}
                {activeDrawerStep === "pwa" && <Smartphone className="h-6 w-6" />}
                {activeDrawerStep === "fcm" && <Bell className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-foreground">
                  {activeDrawerStep === "apiKey" && "LLM API Key Setup"}
                  {activeDrawerStep === "pwa" && "PWA Offline Installation"}
                  {activeDrawerStep === "fcm" && "FCM Setup & Reminders"}
                </h3>
                <p className="text-xs text-muted-foreground">Step details & interactive setup controls</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body for active step */}
          {activeDrawerStep === "apiKey" && <ApiKeyDrawer {...apiKeyProps} />}
          {activeDrawerStep === "pwa" && <PwaDrawer {...pwaProps} />}
          {activeDrawerStep === "fcm" && <FcmDrawer {...fcmProps} />}
        </div>

        {/* Drawer Footer */}
        <div className="p-6 border-t border-border bg-secondary/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 h-10 rounded-xl bg-foreground text-background font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done / Close Drawer
          </button>
        </div>
      </aside>
    </div>
  )
}
