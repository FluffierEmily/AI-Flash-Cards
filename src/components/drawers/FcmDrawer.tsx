import { Bell } from "lucide-react"

export interface FcmDrawerProps {
  isFcmEnabled: boolean
  fcmToken: string | null
  handleEnableFcm: () => void
  handleDisableFcm: () => void
}

export function FcmDrawer({
  isFcmEnabled,
  fcmToken,
  handleEnableFcm,
  handleDisableFcm
}: FcmDrawerProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
        <div className="flex items-center gap-2 text-purple-500 font-semibold text-sm">
          <Bell className="h-4 w-4" />
          Intelligent Flashcard Review Reminders
        </div>
        <p>
          Firebase Cloud Messaging sends timely notifications right when your cards are scheduled for maximum retention review.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-foreground">Push Notification Status</h4>
        <div className="p-4 rounded-xl border border-border bg-secondary/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">{isFcmEnabled ? "Push Reminders Active" : "Reminders Disabled"}</p>
            <p className="text-[11px] text-muted-foreground">
              {isFcmEnabled ? `Registered Token: ${fcmToken?.substring(0, 18)}...` : "Permission not granted"}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isFcmEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
            {isFcmEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        {!isFcmEnabled ? (
          <button
            onClick={handleEnableFcm}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-sm cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            Enable Notifications & Request Permission
          </button>
        ) : (
          <button
            onClick={handleDisableFcm}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-accent transition-all shadow-sm cursor-pointer"
          >
            Disable FCM Notifications
          </button>
        )}
      </div>
    </div>
  )
}
